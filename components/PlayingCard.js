import React from 'react';
import { 
    View,
    Image,
    StyleSheet,
    TouchableWithoutFeedback 
} from 'react-native';

class PlayingCard extends React.Component {
    render() {
        let { cardState, onCardPressed, width } = this.props
        let { isFlipped, image } = cardState
        let height = width * (314 / 226)
        let marginPadding = width * 0.2

        let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_06.svg/209px-Card_back_06.svg.png'
        if(isFlipped)
            imageUrl = image

        return (
            <View>
                <TouchableWithoutFeedback
                    onPress={onCardPressed}
                >
                    <Image 
                        style={{
                            width: width, 
                            height: height,
                            marginRight: marginPadding / 2,
                            marginLeft: marginPadding / 2
                        }}
                        source={{ 
                            uri: imageUrl
                        }} 
                        resizeMode={'contain'}
                    />
                </TouchableWithoutFeedback>
            </View>
        );
    }
};

export default PlayingCard;
