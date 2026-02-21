<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class AdminContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query();

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('subject', 'like', '%' . $request->search . '%')
                  ->orWhere('message', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('is_read')) {
            $query->where('is_read', $request->is_read);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $contacts = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->sendJsonResponse(true, 'Contacts fetched successfully', $contacts, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:contacts,id',
        ]);

        $contact = Contact::findOrFail($request->id);

        // Mark as read when viewing
        if (!$contact->is_read) {
            $contact->update(['is_read' => true]);
        }

        return $this->sendJsonResponse(true, 'Contact fetched successfully', $contact, 200);
    }

    public function markAsRead(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:contacts,id',
        ]);

        $contact = Contact::findOrFail($request->id);
        $contact->update(['is_read' => true]);

        return $this->sendJsonResponse(true, 'Contact marked as read', $contact, 200);
    }

    public function markAsUnread(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:contacts,id',
        ]);

        $contact = Contact::findOrFail($request->id);
        $contact->update(['is_read' => false]);

        return $this->sendJsonResponse(true, 'Contact marked as unread', $contact, 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:contacts,id',
        ]);

        $contact = Contact::findOrFail($request->id);
        $contact->delete();

        return $this->sendJsonResponse(true, 'Contact deleted successfully', [], 200);
    }

    public function getCounts()
    {
        $counts = [
            'total' => Contact::count(),
            'unread' => Contact::where('is_read', false)->count(),
            'read' => Contact::where('is_read', true)->count(),
        ];

        return $this->sendJsonResponse(true, 'Contact counts fetched successfully', $counts, 200);
    }
}

