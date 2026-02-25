<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StockPurchase;
use Illuminate\Http\Request;

class AdminStockPurchaseController extends Controller
{
    /**
     * List all stock purchases
     */
    public function index(Request $request)
    {
        try {
            $query = StockPurchase::orderBy('created_at', 'desc');

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('shop_name', 'like', "%{$search}%")
                      ->orWhere('mobile', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $stockPurchases = $query->paginate($perPage);

            return $this->sendJsonResponse(true, 'Stock purchases fetched successfully', $stockPurchases, 200);
        } catch (\Exception $e) {
            return $this->sendError($e);
        }
    }

    /**
     * Get a single stock purchase
     */
    public function show(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|exists:stock_purchases,id',
            ]);

            $stockPurchase = StockPurchase::findOrFail($request->id);
            return $this->sendJsonResponse(true, 'Stock purchase fetched successfully', $stockPurchase, 200);
        } catch (\Exception $e) {
            return $this->sendError($e);
        }
    }

    /**
     * Create a new stock purchase
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'shop_name' => 'required|string|max:255',
                'mobile' => 'required|string|max:20',
                'address' => 'nullable|string',
                'notes' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
            ]);

            $stockPurchase = StockPurchase::create([
                'shop_name' => $request->shop_name,
                'mobile' => $request->mobile,
                'address' => $request->address,
                'notes' => $request->notes,
                'amount' => $request->amount,
            ]);

            return $this->sendJsonResponse(true, 'Stock purchase created successfully', $stockPurchase, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendJsonResponse(false, 'Validation failed', ['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->sendError($e);
        }
    }

    /**
     * Update a stock purchase
     */
    public function update(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|exists:stock_purchases,id',
                'shop_name' => 'required|string|max:255',
                'mobile' => 'required|string|max:20',
                'address' => 'nullable|string',
                'notes' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
            ]);

            $stockPurchase = StockPurchase::findOrFail($request->id);
            
            $stockPurchase->update([
                'shop_name' => $request->shop_name,
                'mobile' => $request->mobile,
                'address' => $request->address,
                'notes' => $request->notes,
                'amount' => $request->amount,
            ]);

            return $this->sendJsonResponse(true, 'Stock purchase updated successfully', $stockPurchase->fresh(), 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendJsonResponse(false, 'Validation failed', ['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->sendError($e);
        }
    }

    /**
     * Delete a stock purchase
     */
    public function destroy(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|exists:stock_purchases,id',
            ]);

            $stockPurchase = StockPurchase::findOrFail($request->id);
            $stockPurchase->delete();

            return $this->sendJsonResponse(true, 'Stock purchase deleted successfully', [], 200);
        } catch (\Exception $e) {
            return $this->sendError($e);
        }
    }

}
