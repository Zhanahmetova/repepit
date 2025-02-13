const words = [];

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

function createWord() {
  for (const word of words) {

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        data: {
          title: word.title,
          translation: word.translation,
          description: word.description.map(t => ({text: t})),
          alternative_translations: word.alternative_translations.map(t => ({text: t})),
          pronunciation: word.pronunciation,
        },
      }),
      redirect: "follow",
    };

    fetch("http://localhost:1337/api/words", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log('Successfully created word', word.title))
      .catch((error) => console.error(error));
  }
}

createWord();
