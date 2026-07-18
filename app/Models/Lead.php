<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $fillable = [
        'client_name', 'company', 'phone', 'email', 'source', 'status',
        'priority', 'assignee', 'amount', 'message', 'next_contact_at',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'next_contact_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'amount' => 'integer',
        ];
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest();
    }
}
