<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactApiController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        try {
            // Save contact form submission to database
            $contact = Contact::create([
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
                'message' => $request->message,
                'is_read' => false,
            ]);

            // Log the contact form submission
            Log::info('Contact form submission', [
                'id' => $contact->id,
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
            ]);

            // Send email notification to support
            EmailService::sendContactForm($request->all());

            return $this->sendJsonResponse(true, 'Thank you for contacting us! We will get back to you soon.', [], 200);
        } catch (\Exception $e) {
            Log::error('Contact form error', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return $this->sendJsonResponse(false, 'Something went wrong. Please try again later.', [], 500);
        }
    }
}

