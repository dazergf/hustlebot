import { loadDeployConfig } from './deploy-config.js';
import { updateProduct } from './product-catalog.js';

export async function createLemonSqueezyProduct(product) {
  const config = loadDeployConfig();

  if (!config.lemonsqueezy?.apiKey) {
    console.log('  ⚠ Lemon Squeezy API key not configured');
    return { success: false, error: 'Lemon Squeezy API key not configured. Run: hustlebot factory config' };
  }

  console.log(`  🍋 Creating Lemon Squeezy listing for ${product.name}...`);

  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.lemonsqueezy.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.lemonsqueezy.apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'products',
          attributes: {
            name: product.name,
            description: product.description || `${product.name} — Built by AI, loved by humans.`,
            price: product.price * 100, // cents
            status: 'published',
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: config.lemonsqueezy.storeId,
              },
            },
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const paymentUrl = data.data?.attributes?.buy_now_url;
      console.log(`  ✅ Lemon Squeezy product created: ${paymentUrl}`);

      updateProduct(product.id, { paymentUrl });
      return { success: true, url: paymentUrl };
    } else {
      const error = await response.text();
      return { success: false, error: `API error: ${error.slice(0, 200)}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Full deployment pipeline: GitHub → Vercel → Payment
 */
