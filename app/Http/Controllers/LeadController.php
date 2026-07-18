<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('view_leads'), 403, 'Недостаточно прав для просмотра заявок.');
        $leads = Lead::with('activities')->latest('last_activity_at')->get();
        $today = now()->startOfDay();

        $stats = [
            'total' => $leads->count(),
            'new' => $leads->where('status', 'new')->count(),
            'overdue' => $leads->filter(fn ($lead) => $lead->next_contact_at?->lt(now()) && ! in_array($lead->status, ['won', 'lost']))->count(),
            'revenue' => $leads->where('status', 'won')->sum('amount'),
            'conversion' => $leads->count() ? round($leads->where('status', 'won')->count() / $leads->count() * 100, 1) : 0,
            'today' => $leads->filter(fn ($lead) => $lead->created_at->gte($today))->count(),
        ];

        $sources = $leads->groupBy('source')->map(fn ($items) => [
            'count' => $items->count(),
            'won' => $items->where('status', 'won')->count(),
        ]);

        return response()->json([
            'leads' => $leads,
            'stats' => $stats,
            'sources' => $sources,
            'user' => $request->user(),
            'team' => [
                ['name' => 'Анна Смирнова', 'role' => 'Менеджер', 'initials' => 'АС', 'color' => '#ef8354'],
                ['name' => 'Илья Волков', 'role' => 'Менеджер', 'initials' => 'ИВ', 'color' => '#567568'],
                ['name' => 'Мария Орлова', 'role' => 'Руководитель', 'initials' => 'МО', 'color' => '#6d597a'],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('manage_leads'), 403, 'Недостаточно прав для создания заявок.');
        $data = $request->validate([
            'client_name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:160'],
            'source' => ['required', 'in:site,telegram,phone,email,partner'],
            'message' => ['nullable', 'string', 'max:2000'],
            'amount' => ['nullable', 'integer', 'min:0'],
        ]);

        $lead = Lead::create($data + [
            'status' => 'new',
            'priority' => 'normal',
            'last_activity_at' => now(),
        ]);
        $lead->activities()->create(['body' => 'Заявка создана из канала «'.($data['source'] ?? 'site').'»']);

        return response()->json($lead->load('activities'), 201);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        abort_unless($request->user()->hasPermission('manage_leads'), 403, 'Недостаточно прав для изменения заявок.');
        $data = $request->validate([
            'status' => ['sometimes', 'in:new,in_progress,proposal,won,lost'],
            'priority' => ['sometimes', 'in:low,normal,high'],
            'assignee' => ['sometimes', 'nullable', 'string', 'max:120'],
            'next_contact_at' => ['sometimes', 'nullable', 'date'],
            'amount' => ['sometimes', 'integer', 'min:0'],
        ]);

        $changed = array_keys($data);
        $lead->update($data + ['last_activity_at' => now()]);
        if ($changed) {
            $lead->activities()->create([
                'body' => 'Обновлены поля: '.implode(', ', $changed),
                'author' => 'Мария Орлова',
            ]);
        }

        return response()->json($lead->fresh()->load('activities'));
    }

    public function comment(Request $request, Lead $lead): JsonResponse
    {
        abort_unless($request->user()->hasPermission('manage_leads'), 403, 'Недостаточно прав для комментариев.');
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $lead->update(['last_activity_at' => now()]);
        $activity = $lead->activities()->create([
            'type' => 'comment',
            'author' => 'Мария Орлова',
            'body' => $data['body'],
        ]);

        return response()->json($activity, 201);
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()->hasPermission('export_data'), 403, 'Недостаточно прав для экспорта.');

        return response()->streamDownload(function () {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['ID', 'Клиент', 'Компания', 'Телефон', 'Email', 'Источник', 'Статус', 'Ответственный', 'Сумма', 'Создано'], ';');
            Lead::orderBy('id')->each(fn ($lead) => fputcsv($stream, [
                $lead->id, $lead->client_name, $lead->company, $lead->phone,
                $lead->email, $lead->source, $lead->status, $lead->assignee,
                $lead->amount, $lead->created_at->format('d.m.Y H:i'),
            ], ';'));
            fclose($stream);
        }, 'leads-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
