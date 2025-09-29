import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Import the backend schema type
import config from '../amplify_outputs.json'; // Correct path for the new config file
import './App.css';

// Configure the Amplify client
Amplify.configure(config);

// Generate a TYPE-SAFE client for your backend data
const client = generateClient<Schema>();

// Create a specific TypeScript type for a Product
type Product = Schema['Product']['type'];

function App() {
  // Use the Product type to define the state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Effect to fetch products when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Use the generated GSI query method: listProductsByNameAndInStock
        // - 'name' is the hash key (partition key)
        // - 'inStock' is the sort key, with no condition needed for full list
        // - sortDirection can be ASC (false then true) or DESC (true then false)
        const { data: items, errors } = await client.models.Product.listProductsByNameAndInStock({
          name: 'Product', // Example: Filter by products with 'Product' prefix (adjust as needed)
          sortDirection: 'ASC', // Sort by inStock: false first, then true
          // Optional: Add limit or nextToken for pagination
          // limit: 10,
          // nextToken: '...',
        });

        if (errors) {
          console.error('Failed to fetch products:', errors);
        } else {
          setProducts(items);
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
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>In Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
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