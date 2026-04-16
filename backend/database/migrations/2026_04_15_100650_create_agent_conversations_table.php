<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Ai\Migrations\AiMigration;

return new class extends AiMigration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            // Use a string to store the external identifier and index it for fast lookups
            $table->string('external_user_id')->index();
            $table->string('app_source')->nullable(); // Optional: keep track of which app they came from
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('chats');
        Schema::dropIfExists('chat_messages');
    }
};
