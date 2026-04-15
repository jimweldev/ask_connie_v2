<?php

namespace Database\Seeders;

use App\Models\Example\ExampleTask;
use App\Models\User\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void {
        User::factory(500)->create();
        ExampleTask::factory(50)->create();

        $this->call([
            SystemDropdownSeeder::class,
        ]);
    }
}
