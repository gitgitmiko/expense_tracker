module.exports = {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost/expense-tracker-backend',
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
        },
      },
    },
  };
  