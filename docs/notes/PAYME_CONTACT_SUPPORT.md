# Payme Support Contact Information

## Current Issue
Getting "Access denied - invalid_id" error (code: -32504) when calling `receipts.create` API.

## Your Configuration
- **Virtual Terminal Name**: PREMIUM CARPET-1 (виртуальный терминал)
- **Cashbox ID**: `68ecf66ee902b2f5efb327ea`
- **Test Key**: `%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci`
- **Production Key**: `F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo`
- **API URL (Test)**: `https://checkout.test.paycom.uz/api`
- **Error Message**: "Access denied." with code -32504 and data "invalid_id"

## What We've Tried
✅ Verified credentials are correct
✅ Tested with both test and production keys
✅ Used correct header format (X-Auth for test, Authorization: Basic for production)
✅ Tested with HTTPS public URL (not localhost)
✅ Amount is in correct format (Tiyin)
✅ Request format matches Payme documentation

## Likely Cause
The Virtual Terminal is created and shows as "active" in the dashboard, but **API access for receipts.create method might not be enabled yet**. This requires Payme support to activate.

## Contact Payme Support

### Payme Support Channels:
1. **Phone**: +998 78 150 01 11
2. **Email**: support@paycom.uz
3. **Telegram**: @PaycomUzbekistan
4. **Website**: https://help.paycom.uz/

### What to Tell Them (in Russian/Uzbek):
```
Здравствуйте!

У меня есть виртуальный терминал "PREMIUM CARPET-1" с ID кассы: 68ecf66ee902b2f5efb327ea

При попытке создать чек через API (метод receipts.create), получаю ошибку:
- Код ошибки: -32504
- Сообщение: "Access denied"
- Данные: "invalid_id"

Прошу активировать API доступ для моего виртуального терминала.

Спасибо!
```

### English Version:
```
Hello!

I have a Virtual Terminal "PREMIUM CARPET-1" with Cashbox ID: 68ecf66ee902b2f5efb327ea

When trying to create a receipt via API (receipts.create method), I'm getting an error:
- Error code: -32504
- Message: "Access denied"
- Data: "invalid_id"

Please activate API access for my Virtual Terminal.

Thank you!
```

## What to Request
Ask them to:
1. ✅ Enable API access for receipts.create method
2. ✅ Confirm if Virtual Terminal supports Subscribe API / Receipts API
3. ✅ Verify the Cashbox ID is correct for API calls
4. ✅ Enable test mode API access (we're using test.paycom.uz)
5. ✅ Provide any additional configuration needed

## Expected Response Time
- Telegram: Usually responds within 1-2 hours during business hours
- Email: 1-2 business days
- Phone: Immediate during business hours (9:00-18:00 Tashkent time, GMT+5)

## After Activation
Once Payme support activates your API access:
1. Test again using the test page: `https://9ed63f6b6a5f.ngrok-free.app/app/payme-test`
2. Click "Test Real Payme" button
3. You should get a successful receipt creation with checkout URL
4. Test the payment flow end-to-end

## Alternative Solutions
If support says Virtual Terminal doesn't support API:
1. Request a regular merchant account with Subscribe API
2. Or use Merchant API instead (different integration approach)
3. Check if you need a different type of cashbox for API access

---

**Note**: Keep ngrok running (`ngrok http 9000`) while testing so Payme can reach your callback endpoint when payments are completed.
