import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DriverSignup from '../pages/DriverSignup';
import { act } from 'react-dom/test-utils';

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

// Mock fetch API for vehicle registration
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      id: 1, 
      userId: 1, 
      make: 'Honda', 
      model: 'Accord', 
      type: 'Sedan',
      year: 2022, 
      color: 'Black', 
      licensePlate: 'ABC123',
      seats: 4
    })
  })
) as jest.Mock;

describe('Driver Registration Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    // Reset all mocks and setup default responses
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    })) as jest.Mock;
  });

  test('Completes vehicle registration step successfully', async () => {
    render(<DriverSignup />);
    
    // Check that vehicle form is displayed
    const vehicleTitle = screen.getByText(/Register Your Vehicle/i);
    expect(vehicleTitle).toBeInTheDocument();

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
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueButton);

    // Wait for API call to be made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/vehicles', expect.any(Object));
    });

    // Check for successful transition to license step
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Vehicle information registered"
        })
      );
    });
  });

  test('Shows error when vehicle registration fails', async () => {
    // Mock a failed API response
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ message: 'Failed to register vehicle' })
    })) as jest.Mock;

    render(<DriverSignup />);
    
    // Fill minimal required fields
    const typeDropdown = screen.getByLabelText(/Vehicle Type/i);
    fireEvent.click(typeDropdown);
    const sedanOption = await screen.findByText('Sedan');
    fireEvent.click(sedanOption);

    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    const hondaOption = await screen.findByText('Honda');
    fireEvent.click(hondaOption);

    const modelDropdown = screen.getByLabelText(/Model/i);
    fireEvent.click(modelDropdown);
    const accordOption = await screen.findByText('Accord');
    fireEvent.click(accordOption);

    const licensePlateInput = screen.getByLabelText(/License Plate/i);
    await userEvent.type(licensePlateInput, 'ABC123');

    // Submit vehicle form
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueButton);

    // Wait for error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: expect.stringContaining("Failed to register vehicle")
        })
      );
    });
  });

  test('Vehicle model dropdown changes based on selected make', async () => {
    render(<DriverSignup />);
    
    // First check that model is disabled initially
    const modelSelect = screen.getByLabelText(/Model/i);
    expect(modelSelect).toHaveAttribute('aria-disabled', 'true');
    
    // Select a make
    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    const toyotaOption = await screen.findByText('Toyota');
    fireEvent.click(toyotaOption);
    
    // Now check model is enabled and has Toyota models
    const modelDropdown = screen.getByLabelText(/Model/i);
    fireEvent.click(modelDropdown);
    
    // Toyota-specific models should be available
    await waitFor(() => {
      expect(screen.getByText('Camry')).toBeInTheDocument();
    });
    
    // Change make to Honda
    fireEvent.click(makeDropdown);
    const hondaOption = await screen.findByText('Honda');
    fireEvent.click(hondaOption);
    
    // Click model dropdown again to see Honda models
    fireEvent.click(modelDropdown);
    
    // Honda-specific models should now be available
    await waitFor(() => {
      expect(screen.getByText('Civic')).toBeInTheDocument();
    });
  });
});