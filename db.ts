import mysql from 'mysql';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
