import {
    screen,
    fireEvent,
    waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import {
    localStorageMock
} from '../__mocks__/localStorage.js';

import BillsUI from '../views/BillsUI.js';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import {
    bills
} from '../fixtures/bills.js';

import firebase from '../__mocks__/firebase';
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

            // Screen must contain 'icon-mail'
            expect(screen.getByTestId('icon-mail')).toBeTruthy();
            // "icon-mail" must contain the class "active-icon"
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

            // handleChangeFile function must be called
            expect(handleChangeFile).toBeCalled();
            // The name of the file should be 'image.png'
            expect(inputFile.files[0].name).toBe('image.png');
            expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
            // HTML must contain 'hideErrorMessage'
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

            // mock of handleSubmit
            const handleSubmit = jest.fn(newBill.handleSubmit);

            // EventListener to submit the form
            const submitBtn = screen.getByTestId('form-new-bill');
            submitBtn.addEventListener('submit', handleSubmit);
            fireEvent.submit(submitBtn);

            // handleSubmit function must be called
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

            // mock of handleSubmit
            const handleSubmit = jest.fn(newBill.handleSubmit);

            newBill.fileName = 'invalid';

            // EventListener to submit the form
            const submitBtn = screen.getByTestId('form-new-bill');
            submitBtn.addEventListener('submit', handleSubmit);
            fireEvent.submit(submitBtn);

            // handleSubmit function must be called
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

            // Mock of handleChangeFile
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

            // handleChangeFile function must be called
            expect(handleChangeFile).toBeCalled();
            // The name of the file should be 'image.exe'
            expect(inputFile.files[0].name).toBe('image.exe');
            expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
            await waitFor(() => {
                // We wait for the error message to appear by removing the "hide" class
                expect(screen.getByTestId('errorFile').classList).toHaveLength(0);
            });
        });
    });
});


// POST
describe('Given I am connected as an employee', () => {
    describe('When I create a new bill', () => {
        test('Add bill to mock API POST', async () => {
            const getSpyPost = jest.spyOn(firebase, 'post');

            // Init newBill
            const newBill = {
                id: 'eoKIpYhECmaZAGRrHjaC',
                status: 'refused',
                pct: 10,
                amount: 500,
                email: 'john@doe.com',
                name: 'Facture 236',
                vat: '60',
                fileName: 'preview-facture-free-201903-pdf-1.jpg',
                date: '2021-03-13',
                commentAdmin: 'à valider',
                commentary: 'A déduire',
                type: 'Restaurants et bars',
                fileUrl: 'https://saving.com',
            };
            const bills = await firebase.post(newBill);

            // getSpyPost must have been called once
            expect(getSpyPost).toHaveBeenCalledTimes(1);
            // The number of bills must be 5 
            expect(bills.data.length).toBe(5);
        });

        test('Add bill to API and fails with 404 message error', async () => {
            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error('Erreur 404'))
            );

            // build user interface
            const html = BillsUI({
                error: 'Erreur 404'
            });
            document.body.innerHTML = html;

            const message = await screen.getByText(/Erreur 404/);
            // wait for the 404 error message
            expect(message).toBeTruthy();
        });

        test('Add bill to API and fails with 500 message error', async () => {
            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error('Erreur 404'))
            );

            // build user interface
            const html = BillsUI({
                error: 'Erreur 500'
            });
            document.body.innerHTML = html;

            const message = await screen.getByText(/Erreur 500/);
            // wait for the 500 error message
            expect(message).toBeTruthy();
        });
    });

    describe('When bill form is submited', () => {
        // Test for dive into createBill
        test('Then add new bill', async () => {
            // Build user interface
            const html = NewBillUI();
            document.body.innerHTML = html;

            // Init newBill
            const bill = new NewBill({
                document,
                onNavigate,
                firestore: null,
                localStorage: window.localStorage,
            });

            // We wait for the createBill function to be undefined, if undefined, createBill called
            expect(await bill.createBill(newBill)).toBeUndefined();
        });

        test('Then create Bill and redirect to Bills', async () => {
            // Build user interface
            const html = NewBillUI();
            document.body.innerHTML = html;

            // Init newBill
            const bill = new NewBill({
                document,
                onNavigate,
                Firestore,
                localStorage: window.localStorage,
            });

            bill.createBill = (bill) => bill;

            // Filling DOM elements
            document.querySelector(`select[data-testid='expense-type']`).value = newBill.type;
            document.querySelector(`input[data-testid='expense-name']`).value = newBill.name;
            document.querySelector(`input[data-testid='amount']`).value = newBill.amount;
            document.querySelector(`input[data-testid='datepicker']`).value = newBill.date;
            document.querySelector(`input[data-testid='vat']`).value = newBill.vat;
            document.querySelector(`input[data-testid='pct']`).value = newBill.pct;
            document.querySelector(`textarea[data-testid='commentary']`).value = newBill.commentary;
            bill.fileUrl = newBill.fileUrl;
            bill.fileName = newBill.fileName;

            // Get form
            const submit = screen.getByTestId('form-new-bill');

            // EventListener to submit the form
            const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
            submit.addEventListener('click', handleSubmit);
            userEvent.click(submit);

            // handleSubmit function must be called
            expect(handleSubmit).toHaveBeenCalled();
            expect(screen.queryAllByText('Vous devez entrer au moins 5 caractères.')).toHaveLength(0);
            // We must meet on '# employee / bills'
            expect(document.body.innerHTML).toBe('#employee/bills');
        });
        test('then throw error if name length is equal or less than 5', async () => {

            // Build user interface
            const html = NewBillUI();
            document.body.innerHTML = html;

            // Init newBill
            const bill = new NewBill({
                document,
                onNavigate,
                Firestore,
                localStorage: window.localStorage,
            });
            bill.createBill = (bill) => bill;

            // Fill expense name with > 5 letters
            document.querySelector(`input[data-testid='expense-name']`).value = 'a';

            // Get form
            const submit = screen.getByTestId('form-new-bill');

            // EventListener to submit the form
            const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
            submit.addEventListener('click', handleSubmit);
            userEvent.click(submit);

            // handleSubmit function must be called
            expect(handleSubmit).toHaveBeenCalled();
            await waitFor(() => {
                // We wait for screen to have 'errorExpenseName'
                expect(screen.getByTestId('errorExpenseName')).toBeTruthy();
            });
        });
    });
});
