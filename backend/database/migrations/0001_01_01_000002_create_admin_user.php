<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        $defaultPassword = env('DEFAULT_PASSWORD', 'P@ssword123!');

        DB::table('users')->insert([
            'email' => 'admin@connextglobal.com',
            'password' => Hash::make($defaultPassword),
            'first_name' => 'Admin',
            'middle_name' => '',
            'last_name' => 'Connext',
            'suffix' => '',
            'is_admin' => true,
            'account_type' => 'Main',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        DB::table('users')->where('email', 'admin@connextglobal.com')->delete();
    }
};
