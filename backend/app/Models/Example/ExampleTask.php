<?php

namespace App\Models\Example;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'status',
])]
class ExampleTask extends Model {
    use HasFactory;
}
