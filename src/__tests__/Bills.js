import {
  screen,
  fireEvent
} from "@testing-library/dom";

import {
  localStorageMock
} from "../__mocks__/localStorage.js";

import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import {
  bills
} from "../fixtures/bills.js";

import {
  ROUTES,
  ROUTES_PATH
} from "../constants/routes";
import Router from "../app/Router";

import firebase from "../__mocks__/firebase";
import Firestore from "../app/Firestore";

// LocalStorage - Employee
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});
window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
  })
);

// Init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({
    pathname
  });
};

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', () => {
      // Mock - parameters for bdd Firebase & data fetching
      jest.mock("../app/Firestore");
      Firestore.bills = () => ({
        bills,
        get: jest.fn().mockResolvedValue()
      });

      // Routing variable
      const pathname = ROUTES_PATH["Bills"];

      // build div DOM
      Object.defineProperty(window, "location", {
        value: {
          hash: pathname
        }
      });
      document.body.innerHTML = `<div id="root"></div>`;

      // Router init to get actives CSS classes
      Router();

      expect(
        // "icon-window" must contain the class "active-icon"
        screen.getByTestId("icon-window").classList.contains("active-icon")
      ).toBe(true);
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

      // dates must equal datesSorted
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

      // screen should show Loading
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

      // screen should show Erreur
      expect(screen.getAllByText('Erreur')).toBeTruthy();
    });
  });

  // handleClickNewBill for container/Bills.js
  describe('Given I am connected as Employee and I am on Bills page', () => {
    describe('When I click on the New Bill button', () => {
      test('Then, it should render NewBill page', () => {

        // build user interface
        const html = BillsUI({
          data: []
        });
        document.body.innerHTML = html;

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

        // screen should show Envoyer une note de frais
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      });
    });
  });

  // handleClickIconEye for container/Bills.js
  describe('When I click on the icon eye', () => {
    test('A modal should open', () => {
      // build user interface
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;

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

      // handleClickIconEye function must be called
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById('modaleFile');
      // The modal must be present
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

      // getSpy must have been called once
      expect(getSpy).toHaveBeenCalledTimes(1);
      // The number of bills must be 4
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

      const message = await screen.getByText(/Erreur 404/);
      // wait for the error message 400
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

      const message = await screen.getByText(/Erreur 500/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });
  });
});
