import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  image: {
    width: width,
    height: width * 0.6,
    resizeMode: 'cover',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  ingredientText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
    textAlign: 'left',
  },
  instructionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff7f50',
    marginBottom: 4,
  },
  instructionContent1: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  instructionContent2: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  instructionImage: {
    width: 50, // 원하는 크기로 조절
    height: 50, // 원하는 크기로 조절
    borderRadius: 5,
    marginRight: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    flex: 1, // 텍스트가 남는 공간을 차지하도록 설정
  },
  cookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookmodeButton: {
    backgroundColor: 'rgba(210, 180, 140, 0.7)', // 베이지색 반투명
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 8,
  },
  cookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  backButton: {
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  adjustText: {
    padding: 10,
    color: 'white',
    fontSize: 16,
  },
  ingredientsContainer: {
    padding: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    width: '80%',
    height: '80%', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  ingredientsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 반투명 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute', // 절대 위치
    top: 20,
    right: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    marginRight: 20,
    flexWrap: 'wrap',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    position: 'absolute',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  prevButton: {
    left: 10,
    bottom: 10,
    backgroundColor: '#ccc',
  },
  nextButton: {
    right: 10,
    bottom: 10,
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  stepImage: {
    width: '100%',
    aspectRatio: 1.5,
    height: 130,
    marginVertical: 16,
    alignSelf: 'center', // 이미지가 컨테이너 안에서 중앙에 배치되도록 설정
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ff0000',
  },
  errorText: {  // 에러 메시지 스타일 추가
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  recordButton: {
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 50, // Make the button round
    elevation: 5, // Add shadow effect
  },
  recordButtonRecording: {
    backgroundColor: '#FF4500', // Change color when recording
  },
});

export default styles;
