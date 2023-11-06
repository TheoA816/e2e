CREATE TABLE Users (
    username TEXT NOT NULL PRIMARY KEY,
    i_key TEXT,
    s_key TEXT,
    sign TEXT,
    o_keys TEXT[]
);

CREATE TABLE Temp_Mssg (
    id SERIAL PRIMARY KEY,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    mssg TEXT NOT NULL
);