import { render, screen, DEVICE_SIZES, setupUserEvent } from '../test-utils';
import OtpVerification from './OtpVerification';

describe('OtpVerification Component', () => {
  const mockProps = {
    phoneNumber: '+1 (555) 123-4567',
    onComplete: jest.fn(),
    onBack: jest.fn()
  };

  test('renders correctly on mobile device', () => {
    render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Check basic elements are present
    expect(screen.getByText('Enter OTP Code')).toBeInTheDocument();
    expect(screen.getByText(/Check your messages!/i)).toBeInTheDocument();
    expect(screen.getByText(/You can resend the code in/i)).toBeInTheDocument();
    
    // Verify OTP fields are present
    const otpDigitFields = screen.getAllByLabelText(/OTP digit/i);
    expect(otpDigitFields).toHaveLength(4);
    
    // Verify keypad is present
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: new RegExp(`Number ${i}`, 'i') })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  test('handles back button correctly', async () => {
    const user = setupUserEvent();
    render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Click back button
    const backButton = screen.getByLabelText(/Go back/i);
    await user.click(backButton);
    
    // Check if onBack was called
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  test('handles keypad input correctly', async () => {
    const user = setupUserEvent();
    render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Input OTP via keypad
    await user.click(screen.getByRole('button', { name: /Number 1/i }));
    await user.click(screen.getByRole('button', { name: /Number 2/i }));
    await user.click(screen.getByRole('button', { name: /Number 3/i }));
    await user.click(screen.getByRole('button', { name: /Number 4/i }));
    
    // Check if onComplete is called after all digits are entered
    expect(mockProps.onComplete).toHaveBeenCalled();
  });

  test('handles deletion via keypad correctly', async () => {
    const user = setupUserEvent();
    render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Input some digits
    await user.click(screen.getByRole('button', { name: /Number 1/i }));
    await user.click(screen.getByRole('button', { name: /Number 2/i }));
    
    // Delete a digit
    await user.click(screen.getByRole('button', { name: /Delete/i }));
    
    // Now add three more digits to complete
    await user.click(screen.getByRole('button', { name: /Number 3/i }));
    await user.click(screen.getByRole('button', { name: /Number 4/i }));
    await user.click(screen.getByRole('button', { name: /Number 5/i }));
    
    // Check if onComplete is called after all digits are entered
    expect(mockProps.onComplete).toHaveBeenCalled();
  });

  test('responsive design across different devices', () => {
    // Test small mobile
    const { unmount } = render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileSmall 
    });
    
    // Verify OTP input size is appropriate for small screens
    const otpDigitFields = screen.getAllByLabelText(/OTP digit/i);
    expect(otpDigitFields[0].classList.contains('w-14')).toBe(true);
    
    unmount();
    
    // Test large mobile/tablet
    render(<OtpVerification {...mockProps} />, { 
      viewport: DEVICE_SIZES.tablet 
    });
    
    // Verify keypad layout in larger screen
    const keypadButtons = screen.getAllByRole('button', { name: /Number|Delete/i });
    expect(keypadButtons.length).toBeGreaterThan(10); // Should have at least numbers 0-9 plus delete
  });
});