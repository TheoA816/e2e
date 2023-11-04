import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.tsx");import * as RefreshRuntime from "/@react-refresh";

if (!window.$RefreshReg$) throw new Error("React refresh preamble was not loaded. Something is wrong.");
const prevRefreshReg = window.$RefreshReg$;
const prevRefreshSig = window.$RefreshSig$;
window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx");
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

import __vite__cjsImport1_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=20af787f"; const _jsxDEV = __vite__cjsImport1_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=20af787f"; const useState = __vite__cjsImport2_react["useState"];
import styles from "/src/App.module.css";
import Account from "/src/account/Account.tsx";
import Chat from "/src/chat/Chat.tsx?t=1699013346549";
import Contacts from "/src/contacts/Contacts.tsx";
import { io } from "/node_modules/.vite/deps/socket__io-client.js?v=20af787f";
const socket = io('ws://localhost:3001');
function App() {
    _s();
    const [curChat, setCurChat] = useState(''); // current person we're chatting to
    const [username, setUsername] = useState(''); // current user
    const [contacts, setContacts] = useState([]); // list of people in our contacts
    return /*#__PURE__*/ _jsxDEV("div", {
        className: styles.container,
        children: [
            /*#__PURE__*/ _jsxDEV(Contacts, {
                username: username,
                setCurChat: setCurChat,
                contacts: contacts,
                setContacts: setContacts
            }, void 0, false, {
                fileName: "/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Chat, {
                username: username,
                curChat: curChat,
                socket: socket,
                contacts: contacts,
                setContacts: setContacts
            }, void 0, false, {
                fileName: "/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Account, {
                username: username,
                setUsername: setUsername,
                setCurChat: setCurChat,
                socket: socket
            }, void 0, false, {
                fileName: "/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(App, "Ldz+hniHTXlGJ5tJSnUGg0c6reo=");
_c = App;
export default App;
var _c;
$RefreshReg$(_c, "App");


window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
  RefreshRuntime.registerExportsForReactRefresh("/Users/teeho/Desktop/COMP6841/e2e/client/src/App.tsx", currentExports);
  import.meta.hot.accept((nextExports) => {
    if (!nextExports) return;
    const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports);
    if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
  });
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgc3R5bGVzIGZyb20gJy4vQXBwLm1vZHVsZS5jc3MnO1xuaW1wb3J0IEFjY291bnQgZnJvbSAnLi9hY2NvdW50L0FjY291bnQnO1xuaW1wb3J0IENoYXQgZnJvbSAnLi9jaGF0L0NoYXQnO1xuaW1wb3J0IENvbnRhY3RzIGZyb20gJy4vY29udGFjdHMvQ29udGFjdHMnO1xuaW1wb3J0IHsgaW8gfSBmcm9tICdzb2NrZXQuaW8tY2xpZW50JztcblxuY29uc3Qgc29ja2V0ID0gaW8oJ3dzOi8vbG9jYWxob3N0OjMwMDEnKTtcblxuZnVuY3Rpb24gQXBwKCkge1xuXG4gIGNvbnN0IFtjdXJDaGF0LCBzZXRDdXJDaGF0XSA9IHVzZVN0YXRlKCcnKTsgICAgICAgICAgICAgLy8gY3VycmVudCBwZXJzb24gd2UncmUgY2hhdHRpbmcgdG9cbiAgY29uc3QgW3VzZXJuYW1lLCBzZXRVc2VybmFtZV0gPSB1c2VTdGF0ZSgnJyk7ICAgICAgICAgICAvLyBjdXJyZW50IHVzZXJcbiAgY29uc3QgW2NvbnRhY3RzLCBzZXRDb250YWN0c10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pOyAgLy8gbGlzdCBvZiBwZW9wbGUgaW4gb3VyIGNvbnRhY3RzXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmNvbnRhaW5lcn0+XG4gICAgICA8Q29udGFjdHMgdXNlcm5hbWU9e3VzZXJuYW1lfSBzZXRDdXJDaGF0PXtzZXRDdXJDaGF0fSBjb250YWN0cz17Y29udGFjdHN9IHNldENvbnRhY3RzPXtzZXRDb250YWN0c30vPlxuICAgICAgPENoYXQgdXNlcm5hbWU9e3VzZXJuYW1lfSBjdXJDaGF0PXtjdXJDaGF0fSBzb2NrZXQ9e3NvY2tldH0gY29udGFjdHM9e2NvbnRhY3RzfSBzZXRDb250YWN0cz17c2V0Q29udGFjdHN9Lz5cbiAgICAgIDxBY2NvdW50IHVzZXJuYW1lPXt1c2VybmFtZX0gc2V0VXNlcm5hbWU9e3NldFVzZXJuYW1lfSBzZXRDdXJDaGF0PXtzZXRDdXJDaGF0fSBzb2NrZXQ9e3NvY2tldH0vPlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEFwcFxuIl0sIm5hbWVzIjpbInVzZVN0YXRlIiwic3R5bGVzIiwiQWNjb3VudCIsIkNoYXQiLCJDb250YWN0cyIsImlvIiwic29ja2V0IiwiQXBwIiwiY3VyQ2hhdCIsInNldEN1ckNoYXQiLCJ1c2VybmFtZSIsInNldFVzZXJuYW1lIiwiY29udGFjdHMiLCJzZXRDb250YWN0cyIsImRpdiIsImNsYXNzTmFtZSIsImNvbnRhaW5lciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLFNBQVNBLFFBQVEsUUFBUSxRQUFRO0FBQ2pDLE9BQU9DLFlBQVksbUJBQW1CO0FBQ3RDLE9BQU9DLGFBQWEsb0JBQW9CO0FBQ3hDLE9BQU9DLFVBQVUsY0FBYztBQUMvQixPQUFPQyxjQUFjLHNCQUFzQjtBQUMzQyxTQUFTQyxFQUFFLFFBQVEsbUJBQW1CO0FBRXRDLE1BQU1DLFNBQVNELEdBQUc7QUFFbEIsU0FBU0U7O0lBRVAsTUFBTSxDQUFDQyxTQUFTQyxXQUFXLEdBQUdULFNBQVMsS0FBaUIsbUNBQW1DO0lBQzNGLE1BQU0sQ0FBQ1UsVUFBVUMsWUFBWSxHQUFHWCxTQUFTLEtBQWUsZUFBZTtJQUN2RSxNQUFNLENBQUNZLFVBQVVDLFlBQVksR0FBR2IsU0FBbUIsRUFBRSxHQUFJLGlDQUFpQztJQUUxRixxQkFDRSxRQUFDYztRQUFJQyxXQUFXZCxPQUFPZSxTQUFTOzswQkFDOUIsUUFBQ1o7Z0JBQVNNLFVBQVVBO2dCQUFVRCxZQUFZQTtnQkFBWUcsVUFBVUE7Z0JBQVVDLGFBQWFBOzs7Ozs7MEJBQ3ZGLFFBQUNWO2dCQUFLTyxVQUFVQTtnQkFBVUYsU0FBU0E7Z0JBQVNGLFFBQVFBO2dCQUFRTSxVQUFVQTtnQkFBVUMsYUFBYUE7Ozs7OzswQkFDN0YsUUFBQ1g7Z0JBQVFRLFVBQVVBO2dCQUFVQyxhQUFhQTtnQkFBYUYsWUFBWUE7Z0JBQVlILFFBQVFBOzs7Ozs7Ozs7Ozs7QUFHN0Y7R0FiU0M7S0FBQUE7QUFlVCxlQUFlQSxJQUFHIn0=