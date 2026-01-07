/**
 * +------------------------+
 * | LOCALFORAGE STORE INIT |
 * +------------------------+
 */
const habitStore = localforage.createInstance({
    name: "habits", // database name
    storeName: "habits" // table name
});

export { habitStore }