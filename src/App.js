import React, { useEffect, useState } from 'react';
import uuid from 'react-uuid';
import axios from 'axios';


// const dropboxToken = 'sl.BiU7yMIwdgY6DdiHU8lcRHpIvq5FFwdFitj4ivGFjT4NH9y7JRWWSAgu58eHwLsJf02Ljdq5Q0oTFnXTUojp6P4tytPhTXNiSkyqA19bhNveGazDU16Fs5kfIht6ujEP6ceeJP8'; // Замените на ваш токен доступа Dropbox
// const dropboxToken = 'sl.BiWLfNuBKvpF70ytGjrP0rsGr1gZ_rrP7TfMfm70FaPsKxM1kzyx8kd5W9j-uK2yv5ZmhKhBZc6UTqKyDaSPBFLGj0FRpVgb2otd80XNTjzyOE6ZEbFOADoW7IZld_9h3cmMOZ0'

function getNormalDate(dateS) {
  const dateString = dateS.slice(0, -2);
  const cur_date = dateString.split(' ')[4];
  // const cur_date_hours = cur_date.split(':')[0];
  const date = new Date(dateString);

  const formattedDate = `${(date.getDate()).toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${cur_date}`;
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
  const [date, impressions, clicks, conversions, spend, balance] = entries;

  const isBalanceLow = balance ? (parseFloat(balance.replace(/[^\d,]/g, '').replace(',', '.')) < 1000) : false;

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
        <div className="flex mb-2" style={isBalanceLow ? {color: 'red'} : {}}>
          <span className="font-semibold">Баланс:</span>
          <span className="ml-2">{balance && balance.split(':')[1]}</span>
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
          <span className="ml-2">{spend && (parseFloat(spend.split(':')[1].replace(/[^\d,]/g, '').replace(',', '.')) * 1.2).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const AllStatisticTable = ({filesData}) => {
  const [tableData, setTableData] = useState([]);
  const [spendingsAll, setSpendingsAll] = useState(0);
  let tableDataArray = [];

  useEffect(() => {
    filesData.map(({ fileName, fileData }) => {
      if (!fileName.includes('statistic_pb')) {
        const lines = fileData.split('\n');
        const lastLine = lines[lines.length - 2]; // Игнорируем последнюю пустую строку
        const entries = lastLine.split('||').map(entry => entry.trim());
        const [date, impressions, clicks, conversions, spend, balance] = entries;
        const spendings = parseFloat(spend.split(':')[1].replace(/[^\d,]/g, '').replace(',', '.')) * 1.2; // adding 20% to spendings
        const impr = impressions.split(':')[1];
        if (tableDataArray.length === 0) {
          tableDataArray = [ parseFloat(balance.replace(/[^\d,]/g, '').replace(',', '.')), +impr.replace(/\s/g, ""), +clicks.split(':')[1], !conversions.split(':')[1].includes(',') ? +conversions.split(':')[1] : parseInt(conversions.split(':')[1].replace(",", ""), 10), spendings];
        } else {
          tableDataArray[0] += parseFloat(balance.replace(/[^\d,]/g, '').replace(',', '.'));
          tableDataArray[1] += +impr.replace(/\s/g, "");
          tableDataArray[2] += +clicks.split(':')[1].replace(/[^\d,]/g, '');
          tableDataArray[3] += !conversions.split(':')[1].includes(',') ? +conversions.split(':')[1] : parseInt(conversions.split(':')[1].replace(",", ""), 10);
          tableDataArray[4] += spendings;
          setSpendingsAll(tableDataArray[4]);
        }
      } else {
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
    const bigTable = allTablesData[allTablesData.length - 1];
    const currentNumber = bigTable[bigTable.length - 1][0].split(" ");
    currentNumber.pop();
    
    tableDataArray[5] = (parseInt(currentNumber.join('')) - spendingsAll).toFixed(2) + " руб.";
      }
    })

    if (tableDataArray[0]) {
      tableDataArray[0] = tableDataArray[0].toFixed(2) + ' руб.';
    }

    if (tableDataArray[4]) {
      tableDataArray[4] = tableDataArray[4].toFixed(2) + ' руб.';
    }

    setTableData(tableDataArray);
  }, [tableData]);

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-4 text-center">Общая статистика по сайтам</h2>
      <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Баланс</th>
            <th className="p-2 border">Показы</th>
            <th className="p-2 border">Клики</th>
            <th className="p-2 border">Конверсии</th>
            <th className="p-2 border">Расход</th>
            <th className="p-2 border">Подтвержденный доход</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {
              tableData.map((el, index) => (
                  <td key={uuid()} className="p-2 border">{el}</td>
              ))
            }
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );

  
}

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
          path: '',
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
    window.location.href = 'https://www.dropbox.com/oauth2/authorize?client_id=kf86a9u7u66m4lz&response_type=token&redirect_uri=https://statistic-from-txt.vercel.app';  // --- https://statistic-from-txt.vercel.app ---- Вот тут после redirect_uri= напишите ваш сайт куда вы залили этот проект ||| то есть вам надо заменить https://get-data-from-txt.vercel.app на свою ссылку
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
    <div className="container mx-auto p-4 max-w-[1750px]">
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
      <div className="flex flex-wrap justify-center gap-4">
        {fileData
            .filter(({ fileName }) => !fileName.includes('statistic_pb'))
            .sort((a, b) => a.fileName.localeCompare(b.fileName))
            .map(({ fileName, fileData }) => (
                <React.Fragment key={fileName}>
                  <FileData fileName={fileName} fileData={fileData} />
                </React.Fragment>
            ))}
      </div>
      <React.Fragment>
          <AllStatisticTable filesData={fileData} />
      </React.Fragment>
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
