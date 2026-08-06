"use client";

import PropTypes from 'prop-types';
import { InstagramEmbed, LinkedInEmbed } from 'react-social-media-embed';
import useDimensions from '../../utils/hooks/useDimensions';
import AnimatedBox from '../../assets/animations/socialPageAnimation';
import socialLinks from '../../data/SocialLink.json';

const SocialEmbed = ({ type }) => {
  const {
    calculateInstagramWidth,
    calculateInstagramHeight,
    calculateInstagramReelWidth,
    calculateInstagramReelHeight,
    calculateLinkedInWidth,
    calculateLinkedInHeight
  } = useDimensions();

  let url, postUrl, width, height;

  switch (type) {
    case 'instagramTopPost':
      url = socialLinks.instagramTopPost;
      width = calculateInstagramWidth();
      height = calculateInstagramHeight();
      break;
    case 'instagramBottomPost':
      url = socialLinks.instagramBottomPost;
      width = calculateInstagramWidth();
      height = calculateInstagramHeight();
      break;
    case 'instagramReel':
      url = socialLinks.instagramReel;
      width = calculateInstagramReelWidth();
      height = calculateInstagramReelHeight();
      break;
    case 'linkedInPost':
      url = socialLinks.linkedInPost.url;
      postUrl = socialLinks.linkedInPost.postUrl;
      width = calculateLinkedInWidth();
      height = calculateLinkedInHeight();
      break;
    default:
      return null;
  }

  return (
    <AnimatedBox>
      {type === 'linkedInPost' ? (
        <LinkedInEmbed url={url} postUrl={postUrl} width={width} height={height} />
      ) : (
        <InstagramEmbed url={url} width={width} height={height} />
      )}
    </AnimatedBox>
  );
};

SocialEmbed.propTypes = {
  type: PropTypes.oneOf([
    'instagramTopPost',
    'instagramBottomPost',
    'instagramReel',
    'linkedInPost',
  ]).isRequired,
};

export default SocialEmbed;
