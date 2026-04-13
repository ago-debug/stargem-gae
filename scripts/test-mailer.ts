import 'dotenv/config';
import { sendWelcomeEmail, sendResetPasswordEmail, sendActivationConfirmEmail } from '../server/utils/mailer';

(async () => {
  const testEmail = 'gae71@mac.com';
  const testNome = 'Cavallo';
  const testOtp = '123456';

  console.log('Test 1: Welcome email...');
  try {
    await sendWelcomeEmail(testEmail, testNome, testOtp);
    console.log('✅ Welcome email inviata');
  } catch(e: any) {
    console.log('❌ Welcome:', e.message);
  }

  console.log('Test 2: Reset password...');
  try {
    await sendResetPasswordEmail(testEmail, testNome, testOtp);
    console.log('✅ Reset email inviata');
  } catch(e: any) {
    console.log('❌ Reset:', e.message);
  }

  console.log('Test 3: Activation confirm...');
  try {
    await sendActivationConfirmEmail(testEmail, testNome);
    console.log('✅ Activation email inviata');
  } catch(e: any) {
    console.log('❌ Activation:', e.message);
  }
})();
