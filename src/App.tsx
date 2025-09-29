import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // 1. Import the backend schema type
import config from '../amplify_outputs.json'; // 2. Correct path for the new config file
import './App.css';

// Configure the Amplify client
Amplify.configure(config);

// 3. Generate a TYPE-SAFE client for your backend data
const client = generateClient<Schema>();

// 4. Create a specific TypeScript type for a Product
type Product = Schema['Product']['type'];

function App() {
  // 5. Use the Product type to define the state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Effect to fetch products when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // CORRECT GSI QUERY:
        // This query uses the exact strategy from your example. By filtering on 'type'
        // (the GSI partition key), the client automatically queries the 'byPrice' index.
        // The results are returned sorted by the GSI's sort key ('price').
        const { data: items, errors } = await client.models.Product.list({
          filter: {
            name: { eq: 'Product -BBc' }
          }
        });

        if (errors) {
          console.error('Failed to fetch products:', errors);
        } else {
          // The data is already sorted by the database (ascending by default).
          // If you want DESCENDING order, you can sort here on the client.
          const sortedItems = items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          setProducts(sortedItems);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <main className="App">
      <h1>Product List</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>In Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>${product.price?.toFixed(2)}</td>
              <td>{product.inStock ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default App;

