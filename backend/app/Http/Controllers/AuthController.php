<?php

namespace App\Http\Controllers;

// Import necessary classes
use App\Models\User\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller {
    /**
     * Handle user registration
     */
    public function register(Request $request) {
        try {
            // Validate incoming request data
            $validatedData = $request->validate([
                'email' => 'required|string|email|max:255',
                'password' => 'required|string|min:8|confirmed', // requires password_confirmation field
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix' => 'nullable|string|max:255',
            ]);

            // Hash the password before storing
            $hashedPassword = Hash::make($validatedData['password']);
            $validatedData['password'] = $hashedPassword;

            // Check if email already exists in the database
            if (User::where('email', $validatedData['email'])->exists()) {
                return response()->json(['error' => 'Email already exists'], 400);
            }

            // Create new user record
            $user = User::create($validatedData);

            // Return user with generated token
            return $this->respondWithToken($user);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle login using email and password
     */
    public function loginWithPassword(Request $request) {
        try {
            // Validate login credentials
            $validatedData = $request->validate([
                'email' => 'required|string|email|max:255',
                'password' => 'required|string|min:8',
            ]);

            // Find user by email
            $user = User::where('email', $validatedData['email'])->first();

            // Return error if user does not exist
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            // Check if provided password matches stored hash
            if (!Hash::check($validatedData['password'], $user->password)) {
                return response()->json(['error' => 'Invalid password'], 401);
            }

            // Return user with generated token
            return $this->respondWithToken($user);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate response containing user data and access token
     */
    private function respondWithToken($user) {
        // Generate access token
        $accessToken = $this->generateToken($user, 'accessToken');

        // Return JSON response
        return response()->json([
            'user' => $user,
            'access_token' => $accessToken,
        ]);
    }

    /**
     * Generate JWT token based on type (access or refresh)
     */
    private function generateToken(User $user, string $type) {
        // Determine token TTL (time-to-live) based on token type
        switch ($type) {
            case 'accessToken':
                $ttl = config('jwt.ttl'); // short-lived token
                break;

            case 'refreshToken':
                $ttl = config('jwt.refresh_ttl'); // longer-lived token
                break;

            default:
                $ttl = config('jwt.ttl'); // fallback to access token TTL
        }

        // Generate JWT with custom expiration claim
        return JWTAuth::customClaims([
            'exp' => now()->addMinutes($ttl)->timestamp,
        ])->fromUser($user);
    }
}
