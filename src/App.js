import React, { useEffect, useState } from 'react';
import uuid from 'react-uuid';
import axios from 'axios';


// const dropboxToken = 'sl.BiU7yMIwdgY6DdiHU8lcRHpIvq5FFwdFitj4ivGFjT4NH9y7JRWWSAgu58eHwLsJf02Ljdq5Q0oTFnXTUojp6P4tytPhTXNiSkyqA19bhNveGazDU16Fs5kfIht6ujEP6ceeJP8'; // Замените на ваш токен доступа Dropbox
// const dropboxToken = 'sl.BiWLfNuBKvpF70ytGjrP0rsGr1gZ_rrP7TfMfm70FaPsKxM1kzyx8kd5W9j-uK2yv5ZmhKhBZc6UTqKyDaSPBFLGj0FRpVgb2otd80XNTjzyOE6ZEbFOADoW7IZld_9h3cmMOZ0'

function getNormalDate(dateS) {
  const dateString = dateS.slice(0, -2);
  const date = new Date(dateString);

  const formattedDate = `${(date.getDate()).toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${(date.getHours()).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')}:${(date.getSeconds()).toString().padStart(2, '0')}`;
  return formattedDate;
}

const FileData = ({ fileName, fileData }) => {
  const [latestEntry, setLatestEntry] = useState('');

  useEffect(() => {
    // Получение последней строки из данных
    const lines = fileData.split('\n');
    const lastLine = lines[lines.length - 2]; // Игнорируем последнюю пустую строку

    setLatestEntry(lastLine);
  }, [fileData]);

  // Разбивка последней строки на отдельные значения
  const entries = latestEntry.split('||').map(entry => entry.trim());

  // Получение значений из последней строки
  const [date, impressions, clicks, conversions, spend] = entries;

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4 w-80">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">{fileName.split('.')[0]}</h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex mb-2">
          <span className="font-semibold">Дата и время:</span>
          <span className="ml-2">{getNormalDate(date)}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Показы:</span>
          <span className="ml-2">{impressions && impressions.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Клики:</span>
          <span className="ml-2">{clicks && clicks.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Конверсии:</span>
          <span className="ml-2">{conversions && conversions.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Расход:</span>
          <span className="ml-2">{spend && spend.split(':')[1]}</span>
        </div>
      </div>
    </div>
  );
};

const FooterTable = ({ fileName, fileData }) => {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    // Разбивка данных на отдельные строки
    const allTablesData = [[]]
    fileData = fileData.replace(/\s+\|\|/g, '||');
    const lines = fileData.split('\n');
    const rows = lines.map(line => line.split('||').map(entry => entry.trim()));

    rows.forEach((el, index) => {
      const last = allTablesData.length - 1;
      if (el[0] === '') {
        allTablesData.push([]);
      } else {
        allTablesData[last].push(el);
      }
    })

    allTablesData.splice(-2);
    setTableData(allTablesData[allTablesData.length - 1]);

  }, [fileData]);

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-4">{fileName.split('.')[0]}</h2>
      <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Дата и время</th>
            <th className="p-2 border">Уникальных</th>
            <th className="p-2 border">Глубина</th>
            <th className="p-2 border">Конверсий всего</th>
            <th className="p-2 border">Новых</th>
            <th className="p-2 border">В работе</th>
            <th className="p-2 border">Отказных</th>
            <th className="p-2 border">Треш</th>
            <th className="p-2 border">Сумма в работе</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {
              tableData.map((el, index) => (
                (el && el[0] && el[0] !== '') ?
                  <td key={uuid()} className="p-2 border">{el[0].includes('(') ? getNormalDate(el[0]) : el[0]}</td>
                  :
                  ''
              ))
            }
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

const App = () => {
  const [fileData, setFileData] = useState([]);
  const [error, setError] = useState("");
  const [dropboxToken, setDropboxToken] = useState(""); // Состояние для токена Dropbox
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Состояние для проверки входа пользователя


  useEffect(() => {
    const fetchFilesFromDropbox = async () => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          return; // Прекратить выполнение, если токен отсутствует
        } else {
          setDropboxToken(currentToken);
        }



        // Запрос списка файлов из Dropbox с использованием токена
        const response = await axios.post('https://api.dropboxapi.com/2/files/list_folder', {
          path: '/tests',
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dropboxToken}`,
          },
        });

        if (response.status === 200) {
          const files = response.data.entries;
          const promises = files.map(async (file) => {
            const fileResponse = await axios.post('https://content.dropboxapi.com/2/files/download', null, {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Authorization': `Bearer ${dropboxToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                  path: file.path_display,
                }),
              },
            });

            if (fileResponse.status === 200) {
              const fileData = fileResponse.data;
              return { fileName: file.name, fileData };
            } else {
              // console.error('Ошибка при загрузке файла из Dropbox:', file.name);
              return null;
            }
          });

          const fileData = await Promise.all(promises);
          setFileData(fileData.filter((file) => file !== null));
        } else {
          // console.error('Ошибка при получении списка файлов из Dropbox:', response.status);
          // setError("Обновите api токен для Dropbox");
        }
      } catch (error) {
        // console.error('Ошибка при выполнении запроса к Dropbox API:', error);
      }
    };

    fetchFilesFromDropbox();
  }, [dropboxToken]);

  const handleLogin = () => {
    // Перенаправление на страницу аутентификации Dropbox OAuth
    window.location.href = 'https://www.dropbox.com/oauth2/authorize?client_id=3zcdbbqz12y06pp&response_type=token&redirect_uri=http://mirralis.tk/Get_data_from_txt/'; // Вот тут после redirect_uri= напишите ваш сайт куда вы залили этот проект ||| то есть вам надо заменить https://get-data-from-txt.vercel.app на свою ссылку
  };

  const handleOAuthCallback = () => {
    const token = window.location.hash.split('=')[1]; // Получение токена из URL
    const cleanToken = token.split('&')[0];
    localStorage.setItem('token', cleanToken);
    setDropboxToken(cleanToken); // Установка токена Dropbox
    setIsLoggedIn(true); // Установка состояния входа пользователя

    // Очистка URL от токена
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  useEffect(() => {
    // Проверка, был ли выполнен вход при загрузке страницы
    if (window.location.hash.includes('access_token')) {
      handleOAuthCallback();
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Статистика</h1>

      {!isLoggedIn ? (
        <div className="flex justify-center mb-4">
          <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md" onClick={handleLogin}>
            Войти в аккаунт Dropbox
          </button>
        </div>
      ) : ''}

      {error !== "" && (
        <h1 className="text-3xl font-bold text-center mt-4 text-red-600">{error}</h1>
      )}
      <div className="flex flex-wrap just justify-center gap-4">
        {fileData.map(({ fileName, fileData }) => (
          <React.Fragment key={fileName}>
            {!fileName.includes('statistic_pb') && (
              <FileData fileName={fileName} fileData={fileData} />
            )}
          </React.Fragment>
        ))}
      </div>
      {fileData.map(({ fileName, fileData }) => (
        <React.Fragment key={fileName}>
          {fileName.includes('statistic_pb') && (
            <FooterTable fileName={fileName} fileData={fileData} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default App;