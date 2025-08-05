import express, { Express } from 'express';
import path from 'path';
const expressHandlebars = require('express-handlebars');
import * as sql from './configs/sql'; // giả sử bạn export connect, sequelize...
import router from './routers'; // phải là export default từ routers/index.ts

const app: Express = express();
const port = 3000;

// Cấu hình view engine
app.engine('hdbs', expressHandlebars.engine({
    extname: '.hdbs',
}));
app.set('view engine', '.hdbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

// Cấu hình static files
app.use(express.static(path.join(__dirname, '..', 'public')));

//cấu hình cookie
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Kết nối CSDL nếu cần
sql.connect();

//sync
import { sequelize } from './configs/sql';
sequelize.sync() // Tạo bảng nếu chưa có, giữ dữ liệu cũ
    .then(() => console.log('Database synced'))
    .catch(console.error);

//make the data of body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

router(app); // ✅ không còn lỗi vì đúng kiểu

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
