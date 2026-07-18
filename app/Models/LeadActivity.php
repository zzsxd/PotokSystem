<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadActivity extends Model
{
    protected $fillable = ['type', 'author', 'body'];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
