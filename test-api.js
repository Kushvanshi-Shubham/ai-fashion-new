// Simple test script to check API endpoints
const testCategoryAPI = async () => {
  try {
    console.log('Testing category API...');
    const response = await fetch('http://localhost:3000/api/categories/IB_BERMUDA/form');
    const data = await response.json();
    console.log('Category API Status:', response.status);
    console.log('Category API Success:', data.success);
    console.log('Fields count:', data.data?.fields?.length || 0);
    
    if (data.data?.fields?.length > 0) {
      console.log('First field:', JSON.stringify(data.data.fields[0], null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('Category API Error:', error.message);
    return null;
  }
};

const testExtractAPI = async () => {
  try {
    console.log('\nTesting extract API...');
    const formData = new FormData();
    
    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        formData.append('file', blob, 'test.png');
        formData.append('categoryId', 'IB_BERMUDA');
        
        try {
          const response = await fetch('http://localhost:3000/api/extract', {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          console.log('Extract API Status:', response.status);
          console.log('Extract API Response:', JSON.stringify(data, null, 2));
          resolve(data);
        } catch (error) {
          console.error('Extract API Error:', error.message);
          resolve(null);
        }
      }, 'image/png');
    });
  } catch (error) {
    console.error('Extract API Setup Error:', error.message);
    return null;
  }
};

// Run tests
(async () => {
  await testCategoryAPI();
  await testExtractAPI();
})();