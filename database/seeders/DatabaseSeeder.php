<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Мария Орлова',
            'email' => 'admin@potok.ru',
            'password' => 'password',
            'role' => 'admin',
            'permissions' => ['view_leads', 'manage_leads', 'view_analytics', 'export_data', 'manage_users'],
            'is_active' => true,
        ]);
        User::create([
            'name' => 'Анна Смирнова',
            'email' => 'manager@potok.ru',
            'password' => 'password',
            'role' => 'manager',
            'permissions' => ['view_leads', 'manage_leads', 'view_analytics', 'export_data'],
            'is_active' => true,
        ]);
        User::create([
            'name' => 'Илья Волков',
            'email' => 'viewer@potok.ru',
            'password' => 'password',
            'role' => 'observer',
            'permissions' => ['view_leads', 'view_analytics'],
            'is_active' => true,
        ]);

        $items = [
            ['Алексей Воронов', 'СтройГрад', '+7 999 243-18-02', 'site', 'new', null, 185000, 'Нужна автоматизация заявок для отдела из 5 человек', 'high', -20],
            ['Елена Крылова', 'Lime Studio', '+7 921 410-72-66', 'telegram', 'new', 'Анна Смирнова', 72000, 'Хочу обсудить интеграцию с Telegram-ботом', 'normal', -80],
            ['Дмитрий Белов', 'Белый Кот', '+7 903 116-90-21', 'phone', 'in_progress', 'Илья Волков', 130000, 'CRM для сети груминг-салонов', 'high', -220],
            ['София Миронова', 'Miro Coffee', '+7 916 808-43-15', 'site', 'in_progress', 'Анна Смирнова', 98000, 'Заявки с трёх лендингов в одном месте', 'normal', -400],
            ['Артём Соколов', 'Logix', '+7 985 722-09-14', 'partner', 'in_progress', 'Илья Волков', 240000, 'Интеграция с текущей 1С и телефонией', 'high', -1500],
            ['Наталья Фомина', 'Forma', '+7 911 344-62-88', 'telegram', 'proposal', 'Анна Смирнова', 156000, 'Ждёт коммерческое предложение по двум филиалам', 'normal', -2800],
            ['Роман Ким', 'Parket Pro', '+7 926 558-71-03', 'email', 'proposal', 'Илья Волков', 112000, 'Нужны отчёты по источникам и менеджерам', 'low', -4600],
            ['Виктория Лебедева', 'Skill Hall', '+7 905 600-12-77', 'site', 'won', 'Анна Смирнова', 210000, 'Онлайн-школа, заявки с сайта и вебинаров', 'normal', -8800],
            ['Михаил Жуков', 'Nord Cafe', '+7 923 778-44-19', 'telegram', 'won', 'Илья Волков', 145000, 'Внедрение завершено', 'normal', -13400],
            ['Ольга Нестерова', 'Domo', '+7 968 404-30-21', 'site', 'lost', 'Анна Смирнова', 89000, 'Выбрали коробочное решение', 'low', -21000],
            ['Кирилл Макаров', 'ProDent', '+7 916 733-82-50', 'phone', 'new', null, 175000, 'Напоминания администраторам клиники', 'high', -35],
            ['Инна Фёдорова', 'Bloom', '+7 981 930-14-09', 'telegram', 'proposal', 'Анна Смирнова', 67000, 'Автоматизация заказов цветочной студии', 'normal', -5200],
        ];

        foreach ($items as $index => [$name, $company, $phone, $source, $status, $assignee, $amount, $message, $priority, $minutes]) {
            $lead = Lead::create([
                'client_name' => $name, 'company' => $company, 'phone' => $phone,
                'email' => 'client'.($index + 1).'@example.ru', 'source' => $source,
                'status' => $status, 'assignee' => $assignee, 'amount' => $amount,
                'message' => $message, 'priority' => $priority,
                'created_at' => now()->addMinutes($minutes),
                'last_activity_at' => now()->addMinutes($minutes + 5),
                'next_contact_at' => in_array($status, ['won', 'lost']) ? null : now()->addHours(($index % 4) - 1),
            ]);
            $lead->activities()->create([
                'body' => 'Заявка поступила из канала «'.$source.'»',
                'created_at' => $lead->created_at,
            ]);
        }
    }
}
