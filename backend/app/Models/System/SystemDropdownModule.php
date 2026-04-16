<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'label',
])]
class SystemDropdownModule extends Model {
    public function system_dropdown_module_types(): HasMany {
        return $this->hasMany(SystemDropdownModuleType::class, 'system_dropdown_module_id');
    }
}
