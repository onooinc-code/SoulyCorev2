// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET the user profile (mock)
export async function GET(req: NextRequest) {
    // In a real app, this would fetch the current user's profile from a database
    // or an authentication service.
    const mockProfile = {
        name: 'Hedra',
        email: 'hedra@souly.co',
        preferences: {
            theme: 'dark',
            notifications: true,
        },
    };
    return NextResponse.json(mockProfile);
}

// PUT to update the user profile (mock)
export async function PUT(req: NextRequest) {
    const body = await req.json();
    console.log('Updating profile with:', body);
    // In a real app, this would update the user's profile in the database.
    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
}
