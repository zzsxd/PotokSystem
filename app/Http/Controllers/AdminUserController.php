<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    private const PERMISSIONS = [
        'view_leads',
        'manage_leads',
        'view_analytics',
        'export_data',
        'manage_users',
    ];

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'users' => User::latest()->get(),
            'permissions' => self::PERMISSIONS,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $this->validated($request);
        $data['permissions'] = $data['role'] === 'admin' ? self::PERMISSIONS : ($data['permissions'] ?? []);
        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $this->validated($request, $user);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $data['permissions'] = $data['role'] === 'admin' ? self::PERMISSIONS : ($data['permissions'] ?? []);

        if ($request->user()->is($user) && (! $data['is_active'] || $data['role'] !== 'admin')) {
            return response()->json(['message' => 'Нельзя заблокировать себя или снять с себя роль администратора.'], 422);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'Нельзя удалить собственную учётную запись.'], 422);
        }
        $user->delete();

        return response()->json(status: 204);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,manager,observer'],
            'permissions' => ['array'],
            'permissions.*' => [Rule::in(self::PERMISSIONS)],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->hasPermission('manage_users'), 403, 'Недостаточно прав.');
    }
}
