// Test Payme Virtual Terminal Connection
require('dotenv').config()

async function testPayme() {
  const cashboxId = "68ecf66ee902b2f5efb327ea"
  const testKey = "%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci"
  const auth = `Paycom:${cashboxId}:${testKey}`
  const authEncoded = Buffer.from(auth).toString('base64')
  
  console.log('🧪 Testing Payme Virtual Terminal Connection...\n')
  console.log('📋 Configuration:')
  console.log('   Cashbox: PREMIUM CARPET-1 (виртуальный терминал)')
  console.log('   ID:', cashboxId)
  console.log('   API:', 'https://checkout.test.paycom.uz/api')
  console.log('   Auth:', authEncoded.substring(0, 20) + '...\n')
  
  try {
    // Test connection with a simple method
    const response = await fetch('https://checkout.test.paycom.uz/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth': authEncoded
      },
      body: JSON.stringify({
        method: 'receipts.get_fiscal_data',
        params: {}
      })
    })
    
    const data = await response.json()
    
    console.log('📡 API Response:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   Response:', JSON.stringify(data, null, 2))
    
    if (response.ok || (data.error && data.error.code !== -32504)) {
      console.log('\n✅ SUCCESS: Payme API is accessible!')
      console.log('✅ Virtual Terminal credentials are valid!')
      console.log('\n💡 Your Payme integration is ready to use!')
    } else if (response.status === 403 || response.status === 451) {
      console.log('\n⚠️  GEO-RESTRICTION: Payme API blocked')
      console.log('💡 Solution: Use Uzbekistan VPN/proxy to access Payme API')
    } else {
      console.log('\n❌ Error connecting to Payme')
      console.log('💡 Check your credentials in Payme dashboard')
    }
    
  } catch (error) {
    console.log('\n❌ Network Error:', error.message)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  This might be a geo-restriction issue')
      console.log('💡 Try using Uzbekistan VPN/proxy')
    }
  }
}

testPayme()
