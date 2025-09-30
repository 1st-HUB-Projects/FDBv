import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import config from '../amplify_outputs.json';
import './App.css';

// --- 1. INITIALIZATION ---
Amplify.configure(config);
const client = generateClient<Schema>();

// --- 2. TYPE DEFINITIONS ---
type Item = Schema['Item']['type'];
type Order = Schema['Order']['type'];
type Business = Schema['Business']['type'];

// --- 3. MAIN APP COMPONENT ---
function App() {
  // --- STATE MANAGEMENT ---
  const [itemsByAvailability, setItemsByAvailability] = useState<Item[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  // State for order creation form (example)
  const [totalAmount, setTotalAmount] = useState<string>('0.0');
  const [businessId, setBusinessId] = useState<string>('');

  // --- DATA FETCHING & REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    const fetchStaticData = async () => {
      const itemsResult = await client.models.Item.list({
        filter: { type: { eq: 'Item' } },
      });
      if (itemsResult.data) {
        setItemsByAvailability(itemsResult.data);
      } else {
        console.error('Error fetching items:', itemsResult.errors);
      }

      const businessResult = await client.models.Business.list();
      if (businessResult.data) {
        setBusinesses(businessResult.data);
      } else {
        console.error('Error fetching businesses:', businessResult.errors);
      }
    };

    const exampleCustomerId = '+15551234567'; // Replace with a real customer ID

    const orderSub = client.models.Order.observeQuery({
      filter: { customerId: { eq: exampleCustomerId } },
    }).subscribe({
      next: ({ items, isSynced }) => {
        const sortedOrders = [...items].sort((a, b) => b.totalAmount - a.totalAmount);
        setCustomerOrders(sortedOrders);
        if (isSynced) {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('Error on order subscription:', error);
      },
    });

    fetchStaticData();

    return () => {
      orderSub.unsubscribe();
    };
  }, []); // Empty dependency array for running once on mount

  // --- CREATE ORDER FUNCTION ---
  const createOrder = async () => {
    try {
      const exampleCustomerId = '+15551234567'; // Replace with real customer ID
      const newOrder = await client.models.Order.create({
        orderDate: new Date().toISOString(),
        status: 'ORDERED', // Default status
        totalAmount: parseFloat(totalAmount) || 0.0, // Use form input
        businessId: businessId || businesses[0]?.phoneBusiness || '', // Use form input or fallback
        customerId: exampleCustomerId,
      });

      if (newOrder.data) {
        console.log('Created order:', newOrder.data);
        // Optionally reset form fields
        setTotalAmount('0.0');
        setBusinessId('');
      } else {
        console.error('Error creating order:', newOrder.errors);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="loading-container"><h1>Loading Food & Beverage Data...</h1></div>;
  }

  return (
    <main className="app-container">
      <h1>F&B Business Dashboard</h1>

      {/* Form to Create a New Order */}
      <section className="data-section">
        <h2>Create New Order</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createOrder(); // Call createOrder on form submission
          }}
        >
          <div>
            <label>Total Amount:</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="Enter total amount"
              step="0.01"
              required
            />
          </div>
          <div>
            <label>Business:</label>
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              required
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.phoneBusiness} value={business.phoneBusiness}>
                  {business.phoneBusiness} ({business.address})
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Place Order</button>
        </form>
      </section>

      <section className="data-section">
        <h2>Items Sorted by Availability (Lowest First)</h2>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity Available</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {itemsByAvailability.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantityAvailable}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="data-section">
        <h2>Customer Orders Sorted by Amount (Highest First) [REAL-TIME]</h2>
        <ul>
          {customerOrders.map((order) => (
            <li key={order.id}>
              <strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()} <br />
              <strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)} <br />
              <strong>Status:</strong> {order.status}
            </li>
          ))}
        </ul>
      </section>

      <section className="data-section">
        <h2>All Businesses</h2>
        <ul>
          {businesses.map((business) => (
            <li key={business.phoneBusiness}>
              <strong>{business.phoneBusiness}</strong> ({business.address})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;