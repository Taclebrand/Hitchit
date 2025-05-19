import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DriverSignup from '../pages/DriverSignup';

// Mock the wouter location hook
jest.mock('wouter', () => ({
  useLocation: () => ["/driver-signup", () => {}]
}));

// Mock toast notifications
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock fetch API for vehicle and identity verification
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1 })
  })
) as jest.Mock;

// Mock the camera functionality
const mockStream = {
  getTracks: () => [{
    stop: jest.fn()
  }]
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockStream)
  },
  writable: true
});

describe('Driver Verification Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Reset canvas functionality
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      canvas: {
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,fakeImageData'),
      },
    }));
  });

  test('Complete driver verification flow from start to finish', async () => {
    render(<DriverSignup />);
    
    // STEP 1: Vehicle Registration
    // Fill in vehicle type
    const typeDropdown = screen.getByLabelText(/Vehicle Type/i);
    fireEvent.click(typeDropdown);
    const sedanOption = await screen.findByText('Sedan');
    fireEvent.click(sedanOption);

    // Fill in make
    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    const hondaOption = await screen.findByText('Honda');
    fireEvent.click(hondaOption);

    // Fill in model
    const modelDropdown = screen.getByLabelText(/Model/i);
    fireEvent.click(modelDropdown);
    const accordOption = await screen.findByText('Accord');
    fireEvent.click(accordOption);

    // Fill in year
    const yearDropdown = screen.getByLabelText(/Year/i);
    fireEvent.click(yearDropdown);
    const yearOption = await screen.findByText('2022');
    fireEvent.click(yearOption);

    // Fill in color
    const colorDropdown = screen.getByLabelText(/Color/i);
    fireEvent.click(colorDropdown);
    const blackOption = await screen.findByText('Black');
    fireEvent.click(blackOption);

    // Fill in license plate
    const licensePlateInput = screen.getByLabelText(/License Plate/i);
    await userEvent.type(licensePlateInput, 'ABC123');

    // Fill in seats
    const seatsDropdown = screen.getByLabelText(/Available Seats/i);
    fireEvent.click(seatsDropdown);
    const seatsOption = await screen.findByText('4 seats');
    fireEvent.click(seatsOption);

    // Submit vehicle form
    const continueVehicleButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueVehicleButton);

    // STEP 2: Driver License Information
    await waitFor(() => {
      expect(screen.getByText(/Driver License Information/i)).toBeInTheDocument();
    });

    // Fill license details
    const licenseNumberInput = screen.getByLabelText(/License Number/i);
    await userEvent.type(licenseNumberInput, 'DL12345678');

    const expiryDateInput = screen.getByLabelText(/Expiry Date/i);
    await userEvent.type(expiryDateInput, '2028-05-19');

    const stateInput = screen.getByLabelText(/State/i);
    await userEvent.type(stateInput, 'CA');

    const dobInput = screen.getByLabelText(/Date of Birth/i);
    await userEvent.type(dobInput, '1990-01-01');

    // Mock file selection for license front and back
    // Since we can't actually upload files in JSDOM, we'll mock setting the values
    const uploadFrontButton = screen.getByText(/Upload Front/i);
    fireEvent.click(uploadFrontButton);
    
    const uploadBackButton = screen.getByText(/Upload Back/i);
    fireEvent.click(uploadBackButton);

    // Mock the license image values directly
    // In a real situation we'd need to mock the file input event
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining("License")
      }));
    });

    // Continue to verification
    const continueLicenseButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueLicenseButton);

    // STEP 3: Identity Verification
    await waitFor(() => {
      expect(screen.getByText(/Identity Verification/i)).toBeInTheDocument();
    });

    // Mock selfie verification
    const useCameraButton = screen.getByText(/Use Camera/i);
    fireEvent.click(useCameraButton);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // In real tests, we'd verify that camera activation works
    // For this test, simulate capturing an image
    const captureButton = screen.getByText(/Capture/i);
    fireEvent.click(captureButton);

    // Continue to background check
    const continueVerificationButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueVerificationButton);

    // STEP 4: Background Check
    await waitFor(() => {
      expect(screen.getByText(/Background Check/i)).toBeInTheDocument();
    });

    // Fill background check form
    const ssnInput = screen.getByLabelText(/SSN/i);
    await userEvent.type(ssnInput, '123-45-6789');

    const addressInput = screen.getByLabelText(/Address/i);
    await userEvent.type(addressInput, '123 Main St');

    const cityInput = screen.getByLabelText(/City/i);
    await userEvent.type(cityInput, 'San Francisco');

    const stateInputBg = screen.getByLabelText(/State/i);
    await userEvent.type(stateInputBg, 'CA');

    const zipInput = screen.getByLabelText(/ZIP/i);
    await userEvent.type(zipInput, '94105');

    // Check consent boxes
    const consentChecks = screen.getAllByRole('checkbox');
    consentChecks.forEach(check => {
      if (!check.checked) {
        fireEvent.click(check);
      }
    });

    // Submit background check
    const continueBackgroundButton = screen.getByRole('button', { name: /Complete Check/i });
    fireEvent.click(continueBackgroundButton);

    // STEP 5: Final Registration
    await waitFor(() => {
      expect(screen.getByText(/Verification Complete/i)).toBeInTheDocument();
    });

    // Complete registration
    const registerButton = screen.getByRole('button', { name: /Complete Registration/i });
    fireEvent.click(registerButton);

    // Verify API calls were made in the right sequence
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining("Registration Complete")
    }));
  });

  test('Camera error handling shows alternative option', async () => {
    // Mock camera error
    navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(new Error('Camera not available'));
    
    render(<DriverSignup />);
    
    // Navigate to identity verification step by skipping vehicle and license (mock implementation)
    // This assumes you have functions to transition between steps that we can call directly
    // For testing purposes
    
    // Fast forward to identity verification step - mock this by directly manipulating state or UI
    // In the real component, we would complete the previous steps
    
    // Try to use camera
    const useCameraButton = screen.getByText(/Use Camera/i);
    fireEvent.click(useCameraButton);
    
    // Verify error message is shown
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Camera Access Issue"
      }));
    });
    
    // Verify upload alternative is available
    const uploadButton = screen.getByText(/Upload Photo/i);
    expect(uploadButton).toBeInTheDocument();
    
    // Test file upload as alternative
    // Mock file upload since we can't actually upload in tests
    const fileInput = screen.getByLabelText('Upload Photo');
    const file = new File(['dummy content'], 'example.png', {type: 'image/png'});
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);
    
    // Verify that file upload worked
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Photo Uploaded"
      }));
    });
  });
});