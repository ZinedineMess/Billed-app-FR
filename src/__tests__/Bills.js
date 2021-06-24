import {
  screen,
  fireEvent
} from "@testing-library/dom";
import {
  localStorageMock
} from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";
import {
  bills
} from "../fixtures/bills.js";
import {
  ROUTES,
} from "../constants/routes";
import Bills from "../containers/Bills.js";
import firebase from "../__mocks__/firebase";

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', () => {
      // build user interface
      const html = BillsUI({
        data: []
      });
      console.log(html);
      document.body.innerHTML = html;

      //to-do write expect expression
    });

    test('Then bills should be ordered from earliest to latest', () => {
      // build user interface
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;

      // Get text from HTML
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      // Filter by date
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  // LOADING PAGE for views/BillsUI.js
  describe("When I am on Bills page but it's loading", () => {
    test('Then I should land on a loading page', () => {
      // build user interface
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
      // build user interface
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

        // build user interface
        const html = BillsUI({
          data: []
        });
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({
            pathname
          });
        };

        // Init firestore
        const firestore = null;
        // Init Bills
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });

        // Mock handleClickNewBill
        const handleClickNewBill = jest.fn(allBills.handleClickNewBill);
        // Get button eye in DOM
        const billBtn = screen.getByTestId('btn-new-bill');

        // Add event and fire
        billBtn.addEventListener('click', handleClickNewBill);
        fireEvent.click(billBtn);

        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      });
    });
  });

  // handleClickIconEye for container/Bills.js
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

      // build user interface
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        });
      };

      // Init firestore
      const firestore = null;
      // Init Bills
      const allBills = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      // Mock modal comportment
      $.fn.modal = jest.fn();

      // Get button eye in DOM
      const eye = screen.getAllByTestId('icon-eye')[0];

      // Mock function handleClickIconEye
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(eye)
      );

      // Add Event and fire
      eye.addEventListener('click', handleClickIconEye);
      fireEvent.click(eye);

      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById('modaleFile');
      expect(modale).toBeTruthy();
    });
  });
});

// test d'intégration GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills UI", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");

      // Get bills and the new bill
      const bills = await firebase.get();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;

      // await for response
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 500"
      });
      document.body.innerHTML = html;

      // await for response
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
