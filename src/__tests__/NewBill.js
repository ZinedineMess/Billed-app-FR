import {
  screen,
  fireEvent,
  waitFor
} from '@testing-library/dom';

import {
  localStorageMock
} from '../__mocks__/localStorage.js';

import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import {
  bills
} from '../fixtures/bills.js';

import Firestore from '../app/Firestore';

import {
  ROUTES_PATH
} from '../constants/routes';
import Router from '../app/Router';

// Mock - parameters for bdd Firebase & data fetching
jest.mock('../app/Firestore');

// LocalStorage - Employee
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
window.localStorage.setItem(
  'user',
  JSON.stringify({
    type: 'Employee',
  })
);

// Init newBill
const newBill = {
  id: 'QcCK3SzECmaZAGRrHjaC',
  status: 'refused',
  pct: 20,
  amount: 200,
  email: 'a@a',
  name: 'newBill',
  vat: '40',
  fileName: 'preview-facture-free-201801-pdf-1.jpg',
  date: '2002-02-02',
  commentAdmin: 'pas la bonne facture',
  commentary: 'test2',
  type: 'Restaurants et bars',
  fileUrl: 'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732'
};

// Init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = pathname
};


describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then letter icon in vertical layout should be highlighted', () => {
      // Routing variable
      const pathname = ROUTES_PATH['NewBill'];

      // Mock - parameters for bdd Firebase & data fetching
      Firestore.bills = () => ({
        bills,
        get: jest.fn().mockResolvedValue()
      });

      // build div DOM
      Object.defineProperty(window, 'location', {
        value: {
          hash: pathname
        }
      });
      document.body.innerHTML = `<div id='root'></div>`;

      // Router init to get actives CSS classes
      Router();
      expect(screen.getByTestId('icon-mail')).toBeTruthy();
      expect(screen.getByTestId('icon-mail').classList.contains('active-icon')).toBeTruthy();
    });
  });

  describe('When I choose an image to upload', () => {
    test('Then the file input should get the file name', () => {
      // build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      // Mock function handleChangeFile
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      // Add Event and fire
      const inputFile = screen.getByTestId('file');
      inputFile.addEventListener('change', handleChangeFile);

      // Launch event
      fireEvent.change(inputFile, {
        target: {
          files: [new File(['image.png'], 'image.png', {
            type: 'image/png'
          })],
        }
      });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe('image.png');
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
      expect(html.includes("<div class=\"hideErrorMessage\" id=\"errorFileType\" data-testid=\"errorFile\">")).toBeTruthy();
    });
  });

  describe('When I submit the form with an image (jpg, jpeg, png)', () => {
    test('Then it should create a new bill', () => {
      // Init firestore
      const firestore = null;

      // Build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const submitBtn = screen.getByTestId('form-new-bill');
      submitBtn.addEventListener('submit', handleSubmit);
      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('When I add a file other than an image (jpg, jpeg or png)', () => {
    test("Then, the bill shouldn't be created and I stay on the NewBill page", () => {
      // Init firestore
      const firestore = null;

      // Build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileName = 'invalid';
      const submitBtn = screen.getByTestId('form-new-bill');
      submitBtn.addEventListener('submit', handleSubmit);
      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    });

    test('Then the error message should be display', async () => {
      // Build user interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Init newBill
      const newBill = new NewBill({
        document,
        onNavigate,
        Firestore,
        localStorage: window.localStorage,
      });

      // Mock function handleChangeFile
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      // Add Event and fire
      const inputFile = screen.getByTestId('file');
      inputFile.addEventListener('change', handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(['image.exe'], 'image.exe', {
            type: 'image/exe'
          })],
        }
      });
      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe('image.exe');
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();

      // Wait for error message (removing 'hide' class)
      await waitFor(() => {
        expect(screen.getByTestId('errorFile').classList).toHaveLength(0);
      });
    });
  });
});
