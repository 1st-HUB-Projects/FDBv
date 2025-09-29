import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import config from '../amplify_outputs.json';
import './App.css';

Amplify.configure(config);

const client = generateClient<Schema>();

type Product = Schema['Product']['type'];

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Use the correct generated method name
        const { data: items, errors } = await client.models.Product.listProductsByNameAndInStock({
          name: 'Product', // Adjust based on your data
          sortDirection: 'ASC',
        }).catch(() => {
          // Fallback if method not found (for debugging)
          console.warn('listProductsByNameAndInStock not found, trying listProductsByName');
          return client.models.Product.listProductsByName({
            name: 'Product',
          });
        });

        if (errors) {
          console.error('Failed to fetch products:', errors);
        } else {
          setProducts(items || []);
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