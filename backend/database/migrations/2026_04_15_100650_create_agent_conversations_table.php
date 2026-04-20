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
            $table->foreignId('external_user_id')->constrained('external_users')->cascadeOnDelete();
            $table->string('app_source')->nullable(); // Optional: keep track of which app they came from
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('external_user_id')->constrained('external_users')->cascadeOnDelete();
            $table->string('role');
            $table->text('content');
            $table->json('suggested_actions')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('external_user_id')->constrained('external_users')->cascadeOnDelete();
            $table->string('project')->default('IT Helpdesk Support');
            $table->json('data'); // stores the merged draft fields
            $table->timestamps();

            // One active draft per chat
            $table->unique(['chat_id', 'project']);
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
