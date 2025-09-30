import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
// Import the generated TypeScript types from your backend definition
import type { Schema } from '../amplify/data/resource';
// Import the configuration file that connects the frontend to the backend
import config from '../amplify_outputs.json';
import './App.css'; // Assuming you have some basic styling

// --- 1. INITIALIZATION ---
// Configure the Amplify client with the backend outputs
Amplify.configure(config);

// Generate a type-safe data client from your schema.
const client = generateClient<Schema>();

// --- 2. TYPE DEFINITIONS ---
// Create specific TypeScript types for our data models for cleaner code.
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

  // --- DATA FETCHING & REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    // This function will fetch the data that does not need to be real-time.
    const fetchStaticData = async () => {
      // --- Requirement 3: List all items sorted by quantity (using GSI) ---
      const itemsResult = await client.models.Item.list({
        filter: { type: { eq: 'Item' } }
      });
      if (itemsResult.data) {
        setItemsByAvailability(itemsResult.data);
      } else {
        console.error('Error fetching items:', itemsResult.errors);
      }

      // --- Standard Listing: Get all businesses ---
      const businessResult = await client.models.Business.list();
      if (businessResult.data) {
        setBusinesses(businessResult.data);
      } else {
        console.error('Error fetching businesses:', businessResult.errors);
      }
    };

    // --- REAL-TIME SUBSCRIPTION FOR ORDERS (inspired by your link) ---
    // For this example, we'll hardcode a customer's phone number.
    const exampleCustomerId = '+15551234567'; // Replace with a real customer phone from your DB

    // 1. We establish a subscription to a query for the customer's orders.
    // Amplify will fetch the initial data and then listen for any changes.
    const orderSub = client.models.Order.observeQuery({
      filter: {
        customerId: { eq: exampleCustomerId }
      }
    }).subscribe({
      // 2. The 'next' function is called whenever the data changes (initially and on updates).
      next: ({ items, isSynced }) => {
        // The GSI sorts by 'totalAmount' ascending. We'll reverse it for our UI.
        const sortedOrders = [...items].sort((a, b) => b.totalAmount - a.totalAmount);
        setCustomerOrders(sortedOrders);

        // 'isSynced' becomes true after the initial data load. We can use this
        // to know when all data has been fetched for the first time.
        if (isSynced) {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('Error on order subscription:', error);
      }
    });

    // Fetch the non-real-time data as well.
    fetchStaticData();

    // 3. IMPORTANT: The cleanup function. When the component unmounts,
    // we unsubscribe to prevent memory leaks.
    return () => {
      orderSub.unsubscribe();
    };
  }, []); // The empty dependency array ensures this runs only once.

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="loading-container"><h1>Loading Food & Beverage Data...</h1></div>;
  }

  return (
    <main className="app-container">
      <h1>F&B Business Dashboard</h1>

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
            {itemsByAvailability.map(item => (
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
          {customerOrders.map(order => (
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
          {businesses.map(business => (
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

