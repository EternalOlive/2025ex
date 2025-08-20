// 그림 정보 표시
export const displayPaintingInfo = (info) => {
  const infoElement = document.getElementById('painting-info');
  // console.log(infoElement);
  if (!infoElement) {
      console.error("Element not found: #painting-info");
      return;
  }
  console
  // HTML 내용 설정
  infoElement.innerHTML = `
    <h3>${info.title}</h3>
    <p>Artist: ${info.artist}</p>
    <p>Description: ${info.description}</p>
    <p>Year: ${info.year}</p>
  `;
  
  // 'show' 클래스 추가하여 보이게 함
  infoElement.classList.add('show');
};

// 그림 정보 숨기기
export const hidePaintingInfo = () => {
  const infoElement = document.getElementById('painting-info');
  
  if (infoElement) {
      // 'show' 클래스 제거하여 숨기기
      infoElement.classList.remove('show');
  }
};
