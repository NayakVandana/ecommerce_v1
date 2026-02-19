<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fabric;
use Illuminate\Http\Request;

class AdminFabricController extends Controller
{
    public function index(Request $request)
    {
        $query = Fabric::query();

        if ($request->has('search')) {
            $query->where('fabric_name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', $request->query('page', 1));
        $request->query->set('page', $page);
        
        $fabrics = $query->orderBy('sort_order')->orderBy('fabric_name')->paginate($perPage);

        return $this->sendJsonResponse(true, 'Fabrics fetched successfully', $fabrics, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'fabric_name' => 'required|string|max:100|unique:fabrics,fabric_name',
            'description' => 'nullable|string',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $fabric = Fabric::create([
            'fabric_name' => $request->fabric_name,
            'description' => $request->description,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->is_active ?? true,
        ]);

        return $this->sendJsonResponse(true, 'Fabric created successfully', $fabric, 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:fabrics,id',
        ]);

        $fabric = Fabric::findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Fabric fetched successfully', $fabric, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:fabrics,id',
            'fabric_name' => 'sometimes|string|max:100|unique:fabrics,fabric_name,' . $request->id,
            'description' => 'nullable|string',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $fabric = Fabric::findOrFail($request->id);
        $fabric->update($request->only(['fabric_name', 'description', 'sort_order', 'is_active']));

        return $this->sendJsonResponse(true, 'Fabric updated successfully', $fabric->fresh(), 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:fabrics,id',
        ]);

        $fabric = Fabric::findOrFail($request->id);
        $fabric->delete();

        return $this->sendJsonResponse(true, 'Fabric deleted successfully', [], 200);
    }

    public function toggleStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:fabrics,id',
        ]);

        $fabric = Fabric::findOrFail($request->id);
        $fabric->is_active = !$fabric->is_active;
        $fabric->save();

        return $this->sendJsonResponse(true, 'Fabric status updated successfully', $fabric, 200);
    }

    public function list(Request $request)
    {
        // Get all active fabrics for dropdowns/selects
        $fabrics = Fabric::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('fabric_name')
            ->get();

        return $this->sendJsonResponse(true, 'Fabrics fetched successfully', $fabrics, 200);
    }
}
