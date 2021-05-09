const searchInput = document.querySelector('#form__search');
searchInput.addEventListener('input', onInput);

async function onInput(event) {
  const previousSearchResults = document.querySelector('#search__result');

  const newSearchResults = document.createElement('div');
  newSearchResults.setAttribute('id', 'search__result');

  if (searchInput.value.length > 0) {
    const response = await runSearch(searchInput.value);

    if (response.posts.length !== 0) {
      response.posts.forEach(post => {
        const item = document.createElement('a');
        if (post.category === '其他') {
          item.setAttribute('href', '/amp/others/' + post.path);

          if (post.featuredImage) {
            item.classList.add('result__post');

            const featuredImage = document.createElement('amp-img');
            featuredImage.setAttribute('src', post.featuredImage);
            featuredImage.setAttribute('width', 1);
            featuredImage.setAttribute('height', 1);
            featuredImage.setAttribute('layout', 'responsive');
            featuredImage.classList.add('post__image');
            item.appendChild(featuredImage);
          }
          else {
            item.classList.add('result__post__noimage');
          }

          const title = document.createElement('h2');
          title.textContent = post.title;
          item.appendChild(title);

          const description = document.createElement('p');
          description.classList.add('result__description');
          if (post.description !== '') {
            description.textContent = post.description;
          }
          else {
            description.textContent = post.descriptionDefault;
          }
          item.appendChild(description);

          const icon = document.createElement('amp-img');
          icon.setAttribute('src', '/icon/others.png');
          icon.setAttribute('width', 16);
          icon.setAttribute('height', 16);
          icon.setAttribute('layout', 'fixed');
          icon.classList.add('post__category__icon')
          item.appendChild(icon);

          const category__name = document.createElement('p');
          category__name.classList.add('category__name');
          category__name.textContent = '其他';
          item.appendChild(category__name);
        }
        else {
          response.categories.forEach(category => {
            if (post.category === category.id) {
              item.setAttribute('href', '/amp/' + category.path + '/' + post.path);

              if (post.featuredImage) {
                item.classList.add('result__post');

                const featuredImage = document.createElement('amp-img');
                featuredImage.setAttribute('src', post.featuredImage);
                featuredImage.setAttribute('width', 1);
                featuredImage.setAttribute('height', 1);
                featuredImage.setAttribute('layout', 'responsive');
                featuredImage.classList.add('post__image');
                item.appendChild(featuredImage);
              }
              else {
                item.classList.add('result__post__noimage');
              }

              const title = document.createElement('h2');
              title.textContent = post.title;
              item.appendChild(title);

              const description = document.createElement('p');
              description.classList.add('result__description');
              if (post.description !== '') {
                description.textContent = post.description;
              }
              else {
                description.textContent = post.descriptionDefault;
              }
              item.appendChild(description);

              const icon = document.createElement('amp-img');
              icon.setAttribute('src', category.thumbnail || '/icon/others.png');
              icon.setAttribute('width', 16);
              icon.setAttribute('height', 16);
              icon.setAttribute('layout', 'fixed');
              icon.classList.add('post__category__icon')
              item.appendChild(icon);

              const category__name = document.createElement('p');
              category__name.classList.add('category__name');
              category__name.textContent = category.name;
              item.appendChild(category__name);
            }
          });
        }
        newSearchResults.appendChild(item);
      });
    }
    else {
      const noresult = document.createElement('span');
      noresult.classList.add('noresult');
      noresult.textContent = '沒有相關文章';
      newSearchResults.appendChild(noresult);
    }
  }
  document.body.replaceChild(newSearchResults, previousSearchResults);
}

async function runSearch(query) {
  const response = await fetch('https://lefty.blog/amp/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `query=${query}`
  });

  return response.json();
}