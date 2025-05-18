import { render, screen, DEVICE_SIZES, setupUserEvent, isTouchTargetSized } from '../test-utils';
import Registration from './Registration';

describe('Registration Component', () => {
  const mockProps = {
    onComplete: jest.fn(),
    onGoogleLogin: jest.fn(),
    onAppleLogin: jest.fn()
  };

  test('renders correctly on mobile device', () => {
    render(<Registration {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Check basic elements are present
    expect(screen.getByText('Get Started with HitchIt')).toBeInTheDocument();
    expect(screen.getByText(/Let's get started!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    
    // Verify social login buttons
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Apple/i })).toBeInTheDocument();
  });

  test('handles form submission correctly', async () => {
    const user = setupUserEvent();
    render(<Registration {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Fill out the form
    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Phone Number/i), '1234567890');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Password123');
    
    // Check the terms checkbox
    const termsCheckbox = screen.getByRole('checkbox', { name: /I agree to HitchIt's/i });
    await user.click(termsCheckbox);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    await user.click(submitButton);
    
    // Check if onComplete was called with correct phone number
    expect(mockProps.onComplete).toHaveBeenCalledWith('1234567890');
  });

  test('social login buttons work correctly', async () => {
    const user = setupUserEvent();
    render(<Registration {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileMedium 
    });
    
    // Click the Google login button
    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));
    expect(mockProps.onGoogleLogin).toHaveBeenCalled();
    
    // Click the Apple login button
    await user.click(screen.getByRole('button', { name: /Continue with Apple/i }));
    expect(mockProps.onAppleLogin).toHaveBeenCalled();
  });

  test('responsive design across different devices', () => {
    // Test small mobile
    const { unmount, container } = render(<Registration {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileSmall 
    });
    
    // Verify font size is appropriate for small screens
    const heading = screen.getByText('Get Started with HitchIt');
    expect(window.getComputedStyle(heading).fontSize).toBeTruthy();
    
    // Test touch targets are adequately sized for mobile
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    expect(isTouchTargetSized(submitButton)).toBe(true);
    
    unmount();
    
    // Test large mobile
    render(<Registration {...mockProps} />, { 
      viewport: DEVICE_SIZES.mobileLarge 
    });
    
    // Content should still be visible and positioned correctly
    expect(screen.getByText('Get Started with HitchIt')).toBeInTheDocument();
    
    // The layout should adapt but still maintain usability
    const formElements = screen.getAllByRole('textbox');
    formElements.forEach(element => {
      expect(isTouchTargetSized(element)).toBe(true);
    });
  });
});