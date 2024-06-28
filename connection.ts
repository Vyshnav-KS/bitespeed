import mysql from "mysql";

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    charset: "utf8mb4",
    multipleStatements: true,
});

type QueryFn = (sql: string, values?: any) => Promise<any>; // eslint-disable-line

const connection = (): Promise<{
    query: QueryFn;
    release: () => void;
}> =>
    new Promise((resolve, reject) => {
        pool.getConnection((err, connect) => {
            if (err) return reject(err);

            const query = (sql: string, args: string[]) =>
                // eslint-disable-next-line
                new Promise((resolve, reject) => {
                    connect.query(sql, args, (connectError, rows) => {
                        if (connectError) return reject(connectError);
                        return resolve(rows);
                    });
                });

            const release = async () => connect.release();

            return resolve({ query, release });
        });
    });

const query: QueryFn = (sql, binding) =>
    new Promise((resolve, reject) => {
        try {
            pool.query(sql, binding, (err, rows) => {
                if (err) {
                    return reject(err);
                }

                return resolve(rows);
            });
        } catch (err) {
            reject(err);
        }
    });

export default {
    connection,
    query,
};
