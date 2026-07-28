const storeInSession = (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
}

const lookInSession = (key) => {
    const item = sessionStorage.getItem(key)
    return item ? JSON.parse(item) : null;
}

const removeFromSession = (key) => {
    return sessionStorage.removeItem(key)
}

const logOutUser = () => {
    sessionStorage.clear()
}

export { storeInSession, lookInSession, removeFromSession, logOutUser }