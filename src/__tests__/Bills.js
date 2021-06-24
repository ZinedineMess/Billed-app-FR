import {
  screen,
  fireEvent
} from '@testing-library/dom';
import {
  localStorageMock
} from '../__mocks__/localStorage.js';
import BillsUI from '../views/BillsUI.js';
import {
  bills
} from '../fixtures/bills.js';
import {
  ROUTES,
} from '../constants/routes';
import Bills from '../containers/Bills.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', () => {
      const html = BillsUI({
        data: []
      });
      document.body.innerHTML = html;
      //to-do write expect expression
    });
    test('Then bills should be ordered from earliest to latest', () => {
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  // LOADING PAGE for views/BillsUI.js
  describe("When I am on Bills page but it's loading", () => {
    test('Then I should land on a loading page', () => {
      const html = BillsUI({
        data: [],
        loading: true
      });
      document.body.innerHTML = html;
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
  });

  // ERROR PAGE for views/BillsUI.js
  describe('When I am on Bills page but back-end send an error message', () => {
    test('Then I should land on an error page', () => {
      const html = BillsUI({
        data: [],
        loading: false,
        error: 'Whoops!'
      });
      document.body.innerHTML = html;
      expect(screen.getAllByText('Erreur')).toBeTruthy();
    });
  });

  // handleClickNewBill for container/Bills.js
  describe('Given I am connected as Employee and I am on Bills page', () => {
    describe('When I click on the New Bill button', () => {
      test('Then, it should render NewBill page', () => {
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          })
        );
        const html = BillsUI({
          data: []
        });
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({
            pathname
          });
        };

        const firestore = null;
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });

        const handleClickNewBill = jest.fn(allBills.handleClickNewBill);
        const billBtn = screen.getByTestId('btn-new-bill');

        billBtn.addEventListener('click', handleClickNewBill);
        fireEvent.click(billBtn);

        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      });
    });
  });

  // handleClickIconEye for container/Bills.js
  describe('Given I am connected as Employee and I am on Bills page', () => {
    describe('When I click on the icon eye', () => {
      test('A modal should open', () => {
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          })
        );
        const html = BillsUI({
          data: bills
        });
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({
            pathname
          });
        };

        const firestore = null;
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });

        $.fn.modal = jest.fn();
        const eye = screen.getAllByTestId('icon-eye')[0];
        const handleClickIconEye = jest.fn(() =>
          allBills.handleClickIconEye(eye)
        );

        eye.addEventListener('click', handleClickIconEye);
        fireEvent.click(eye);
        expect(handleClickIconEye).toHaveBeenCalled();
        const modale = document.getElementById('modaleFile');
        expect(modale).toBeTruthy();
      });
    });
  });
});
