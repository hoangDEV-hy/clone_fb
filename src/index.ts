import express, { Express } from 'express';
import path from 'path';
const expressHandlebars = require('express-handlebars');
import * as sql from './configs/sql'; // giả sử bạn export connect, sequelize...
import router from './routers'; // phải là export default từ routers/index.ts
//for Messenger 
import { Server } from 'socket.io'
import http from 'http'
import { setup_chat } from './sockets/index';

const app: Express = express();
//change server to ioServer
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;
//function timestamps
const hbs = expressHandlebars.create({
    extname: '.hdbs',
    helpers: {
        time: (dateTime: string) => {
            if (!dateTime) return '';
            const current_time = new Date(dateTime.toString());
            const now_time = new Date();
            const diffMs = now_time.getTime() - current_time.getTime();

            //doi ra day, hour, minu, sec
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) return `${diffDays} day ago`
            else if (diffHours > 0) return `${diffHours} hours ago`
            else if (diffMinutes > 0) return `${diffMinutes} minutes ago`
            else return `${diffSeconds} seconds ago`
        },
        json: (data: object) => {
            return JSON.stringify(data);
        }

    }
});
// Cấu hình view engine
app.engine('.hdbs', hbs.engine);
app.set('view engine', 'hdbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

// Cấu hình static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/upload', express.static(path.join(__dirname, '..', 'upload')));

//cấu hình cookie
import cookieParser from 'cookie-parser';
app.use(cookieParser());

//cấu hình session
import session from 'express-session';
app.use(session({
    secret: 'hoang1', // Chuỗi bí mật để mã hóa session
    resave: false, // không lưu lại session nếu không thay đổi
    saveUninitialized: true, // không lưu session khi chưa set gì
    cookie: {
        secure: false, // true nếu chạy HTTPS
        maxAge: 1000 * 60 * 60 // 1 giờ
    }
}));

// Kết nối CSDL nếu cần
sql.connect();

//sync
import { sequelize } from './configs/sql';
import './models/chat/Model_Chat';

sequelize.sync() // Tạo bảng nếu chưa có, giữ dữ liệu cũ
    .then(() => console.log('Database synced'))
    .catch(console.error);

//make the data of body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//add delete, update methods
import methodOverride from 'method-override';
import { createServer } from 'http';

app.use(methodOverride('_method'));



router(app);
//for listening to  client login
setup_chat(io);

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
