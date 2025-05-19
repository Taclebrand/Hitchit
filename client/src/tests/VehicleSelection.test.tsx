import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DriverSignup from '../pages/DriverSignup';
import { vehicleTypes, carMakes, carModelsByMake } from '../lib/vehicle-data';

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

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1 })
  })
) as jest.Mock;

describe('Vehicle Selection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all vehicle type options', async () => {
    render(<DriverSignup />);
    
    // Open the vehicle type dropdown
    const typeDropdown = screen.getByLabelText(/Vehicle Type/i);
    fireEvent.click(typeDropdown);
    
    // Check if all vehicle types from vehicle-data.ts are rendered
    await Promise.all(vehicleTypes.map(async (type) => {
      const typeOption = await screen.findByText(type.label);
      expect(typeOption).toBeInTheDocument();
    }));
  });

  test('renders all vehicle make options', async () => {
    render(<DriverSignup />);
    
    // Open the make dropdown
    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    
    // Check popular car makes are available
    const popularMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW'];
    await Promise.all(popularMakes.map(async (make) => {
      const makeOption = await screen.findByText(make);
      expect(makeOption).toBeInTheDocument();
    }));
  });

  test('model dropdown changes based on selected make', async () => {
    render(<DriverSignup />);
    
    // Model should be disabled initially
    const modelSelect = screen.getByLabelText(/Model/i);
    expect(modelSelect).toHaveAttribute('aria-disabled', 'true');
    
    // Select Toyota make
    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    const toyotaOption = await screen.findByText('Toyota');
    fireEvent.click(toyotaOption);
    
    // Now model dropdown should be enabled and show Toyota models
    const modelDropdown = screen.getByLabelText(/Model/i);
    fireEvent.click(modelDropdown);
    
    // Check Toyota models
    const toyotaModels = carModelsByMake['Toyota'];
    const sampleToyotaModel = toyotaModels[0].label;
    const modelOption = await screen.findByText(sampleToyotaModel);
    expect(modelOption).toBeInTheDocument();
    
    // Change to Honda make
    fireEvent.click(makeDropdown);
    const hondaOption = await screen.findByText('Honda');
    fireEvent.click(hondaOption);
    
    // Now model dropdown should show Honda models
    fireEvent.click(modelDropdown);
    
    // Check Honda models
    const hondaModels = carModelsByMake['Honda'];
    const sampleHondaModel = hondaModels[0].label;
    const hondaModelOption = await screen.findByText(sampleHondaModel);
    expect(hondaModelOption).toBeInTheDocument();
  });

  test('successfully submits vehicle data with all fields', async () => {
    render(<DriverSignup />);
    
    // Fill out the form with all fields
    // 1. Select vehicle type
    const typeDropdown = screen.getByLabelText(/Vehicle Type/i);
    fireEvent.click(typeDropdown);
    const sedanOption = await screen.findByText('Sedan');
    fireEvent.click(sedanOption);
    
    // 2. Select make
    const makeDropdown = screen.getByLabelText(/Make/i);
    fireEvent.click(makeDropdown);
    const hondaOption = await screen.findByText('Honda');
    fireEvent.click(hondaOption);
    
    // 3. Select model
    const modelDropdown = screen.getByLabelText(/Model/i);
    fireEvent.click(modelDropdown);
    const accordOption = await screen.findByText('Accord');
    fireEvent.click(accordOption);
    
    // 4. Select year
    const yearDropdown = screen.getByLabelText(/Year/i);
    fireEvent.click(yearDropdown);
    const yearOption = await screen.findByText('2022');
    fireEvent.click(yearOption);
    
    // 5. Select color
    const colorDropdown = screen.getByLabelText(/Color/i);
    fireEvent.click(colorDropdown);
    const blackOption = await screen.findByText('Black');
    fireEvent.click(blackOption);
    
    // 6. Enter license plate
    const licensePlateInput = screen.getByLabelText(/License Plate/i);
    await userEvent.type(licensePlateInput, 'ABC123');
    
    // 7. Select seats
    const seatsDropdown = screen.getByLabelText(/Available Seats/i);
    fireEvent.click(seatsDropdown);
    const seatsOption = await screen.findByText('4 seats');
    fireEvent.click(seatsOption);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(submitButton);
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('/api/vehicles');
      
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody).toEqual(expect.objectContaining({
        type: 'Sedan',
        make: 'Honda',
        model: 'Accord',
        year: 2022,
        color: 'Black',
        licensePlate: 'ABC123',
        seats: 4,
        userId: 1
      }));
    });
  });
});